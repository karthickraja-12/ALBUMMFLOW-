"use client";
import { useState, useEffect, use } from 'react';
import { UploadCloud, ArrowLeft, Copy } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import imageCompression from 'browser-image-compression';
import { logger } from '../../../lib/logger';

export default function EventDashboard({ params }) {
  const id = use(params).id;
  const [event, setEvent] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selections, setSelections] = useState([]);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, [id]);

  // Queue Processor: Runs when queue has 'waiting' items and process is triggered
  useEffect(() => {
    if (isProcessing) {
      const nextBatch = uploadQueue.filter(item => item.status === 'waiting').slice(0, 3);
      if (nextBatch.length > 0) {
        nextBatch.forEach(item => processFile(item.id));
      } else if (uploadQueue.every(item => item.status === 'complete' || item.status === 'error')) {
        setIsProcessing(false);
      }
    }
  }, [uploadQueue, isProcessing]);

  const fetchEventData = async () => {
    const res = await fetch(`/api/events/${id}`);
    if (res.ok) {
      const data = await res.json();
      setEvent(data.event);
      setPhotos(data.photos || []);
      setSelections(data.selections || []);
    }
  };

  const handleRevokeSelection = async (photoId) => {
    if (!confirm("Remove this photo from the selection list?")) return;
    try {
      const { error } = await supabase.from('selections').delete().eq('photo_id', photoId).eq('event_id', id);
      if (error) throw error;
      setSelections(prev => prev.filter(s => s.photo_id !== photoId));
    } catch (err) {
       alert("Failed to remove selection: " + err.message);
    }
  };

  const handleDownloadRaw = async () => {
    setDownloading(true);
    try {
      const photoData = finalistPhotos.map(p => ({
        id: p.id,
        googleFileId: p.google_file_id,
        filename: decodeURIComponent(p.url).split('/').pop().split('-').slice(1).join('-')
      }));
      
      const res = await fetch(`/api/events/${id}/gdrive/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          photoData, 
          eventName: event.name 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.links.length === 0) {
        return alert("Could not match any finalist photos natively in Google Drive.");
      }

      if (data.success) {
        alert(`🎉 Success! Your favorites have been archived into a separate folder, and the original set has been cleaned up.`);
      }
    } catch (err) {
      console.error(err);
      alert("Download failed: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newItems = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'waiting',
      progress: 0,
      error: null
    }));

    setUploadQueue(prev => [...prev, ...newItems]);
    setIsProcessing(true);
  };

  const processFile = async (itemId) => {
    const item = uploadQueue.find(i => i.id === itemId);
    if (!item || item.status !== 'waiting') return;

    // Update status to compressing
    updateQueueItem(itemId, { status: 'compressing' });

    try {
      // 1. Compress
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(item.file, options);
      
      // 2. Uploading to Supabase
      updateQueueItem(itemId, { status: 'uploading' });
      const sanitizedName = item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileKey = `events/${id}/${Date.now()}-${sanitizedName}`;

      let retries = 3;
      let uploadSuccess = false;
      while (retries > 0 && !uploadSuccess) {
        const { error } = await supabase.storage.from('albumflow').upload(fileKey, compressedFile);
        if (!error) uploadSuccess = true;
        else {
          retries--;
          if (retries > 0) await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (!uploadSuccess) throw new Error("Supabase Upload Failed");

      // 3. Syncing to GDrive
      updateQueueItem(itemId, { status: 'syncing' });
      const params = new URLSearchParams({ filename: sanitizedName, mimeType: item.file.type, eventName: event.name });
      const gDriveRes = await fetch(`/api/events/${id}/gdrive/upload?${params.toString()}`, {
        method: 'POST',
        body: item.file 
      });

      const googleData = gDriveRes.ok ? await gDriveRes.json() : null;

      // 4. Finalize DB
      const { data: { publicUrl } } = supabase.storage.from('albumflow').getPublicUrl(fileKey);
      const { data: photoRecord, error: dbError } = await supabase.from('photos').insert([
        { event_id: id, url: publicUrl, thumbnail_url: publicUrl, google_file_id: googleData?.googleFileId }
      ]).select().single();

      if (dbError) throw dbError;

      setPhotos(prev => [...prev, photoRecord]);
      updateQueueItem(itemId, { status: 'complete', progress: 100 });

    } catch (err) {
      console.error("Queue error:", err);
      logger.error(`Upload failure for ${item.file.name}`, { error: err.message, eventId: id });
      updateQueueItem(itemId, { status: 'error', error: err.message });
    }
  };

  const updateQueueItem = (id, updates) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleRetry = (itemId) => {
    updateQueueItem(itemId, { status: 'waiting', error: null });
    setIsProcessing(true);
  };

  if (!event) return <div className="container flex-center" style={{ minHeight: '50vh' }}>Loading...</div>;

  const finalistPhotos = photos.filter(p => selections.some(s => s.photo_id === p.id));
  const completedCount = uploadQueue.filter(i => i.status === 'complete').length;
  const totalInQueue = uploadQueue.length;
  const overallProgress = totalInQueue > 0 ? Math.floor((completedCount / totalInQueue) * 100) : 0;

  return (
    <div className="animate-fade" style={{ background: 'var(--background)', minHeight: '100vh', padding: '6rem 0' }}>
      <div className="container">
        
        {/* Editorial Cockpit Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6rem', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(0,0,0,0.3)', textDecoration: 'none', marginBottom: '2.5rem', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.2em' }}>
              <ArrowLeft size={16} strokeWidth={3} /> BACK TO ARCHIVE
            </Link>
            <h1 className="text-signature" style={{ fontSize: '4.5rem', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>{event.name}</h1>
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ padding: '0.75rem 1.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 900, background: 'white', color: 'black', border: '1px solid rgba(0,0,0,0.05)', letterSpacing: '0.1em' }}>
                {selections.length} / {event.max_selections} SELECTIONS
              </div>
              {event.is_finalized && (
                <div style={{ padding: '0.75rem 1.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 900, background: 'rgba(5, 150, 105, 0.08)', color: '#059669', border: '1px solid rgba(5, 150, 105, 0.1)', letterSpacing: '0.15em' }}>FINALIZED</div>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/gallery/${id}`);
              alert("Client link copied to clipboard!");
            }} 
            className="btn-secondary" 
            style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1.25rem 2.5rem', fontSize: '0.85rem' }}
          >
            <Copy size={18} strokeWidth={2.5} /> COPY CLIENT PORTAL LINK
          </button>
        </div>

        {/* Boutique Production Console (Upload) */}
        <div className="glass" style={{ padding: '5rem', marginBottom: '8rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '3rem', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', gap: '6rem', flexWrap: 'wrap' }}>
            {/* Drop Zone */}
            <div style={{ flex: '1 1 350px', border: '2px dashed rgba(0,0,0,0.05)', borderRadius: '2.5rem', padding: '5rem 2rem', textAlign: 'center', transition: 'all 0.5s ease', background: 'rgba(0,0,0,0.01)' }} 
                 onMouseOver={e => {
                   e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                   e.currentTarget.style.background = 'white';
                 }}
                 onMouseOut={e => {
                   e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)';
                   e.currentTarget.style.background = 'rgba(0,0,0,0.01)';
                 }}>
               <div className="flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'black', color: 'white', margin: '0 auto 2.5rem' }}>
                <UploadCloud size={32} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '2rem', marginBottom: '1rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Production Hub</h3>
              <p style={{ color: 'rgba(0,0,0,0.3)', fontSize: '1rem', marginBottom: '3.5rem', maxWidth: '280px', margin: '0 auto 3.5rem', fontWeight: 500 }}>Synchronize high-fidelity assets to the archival core.</p>
              <label className="btn-primary" style={{ cursor: 'pointer', padding: '1rem 3rem', width: 'auto', fontSize: '0.9rem' }}>
                INDUCT ASSETS
                <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>

            {/* Live Status Console */}
            {uploadQueue.length > 0 && (
              <div style={{ flex: '2 1 500px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(0,0,0,0.3)', marginBottom: '0.75rem' }}>
                      TRANSMISSION LOG {isProcessing && <span className="animate-pulse" style={{ color: 'black' }}>• SYNCING</span>}
                    </h4>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{completedCount} / {totalInQueue} IMMUTABLE</span>
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: 'rgba(0,0,0,0.2)' }}>{overallProgress}%</span>
                </div>

                <div style={{ width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: '999px', height: '12px', overflow: 'hidden', marginBottom: '4rem' }}>
                  <div style={{ width: `${overallProgress}%`, background: 'black', height: '100%', transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}></div>
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '1rem' }}>
                  {uploadQueue.slice().reverse().map(item => (
                    <div key={item.id} style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(0,0,0,0.03)', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', overflow: 'hidden' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.status === 'complete' ? 'black' : item.status === 'error' ? 'hsl(var(--danger))' : 'rgba(0,0,0,0.1)' }}></div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>{item.file.name}</span>
                        <span style={{ fontSize: '0.65rem', color: 'rgba(0,0,0,0.2)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.15em' }}>{item.status}</span>
                      </div>
                      
                      {item.status === 'error' ? (
                        <button onClick={() => handleRetry(item.id)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem' }}>RETRY</button>
                      ) : item.status === 'complete' ? (
                        <span style={{ color: 'black', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.15em' }}>INDELIBLE</span>
                      ) : (
                        <div className="animate-spin" style={{ width: '18px', height: '18px', border: '2.5px solid rgba(0,0,0,0.05)', borderTopColor: 'black', borderRadius: '50%' }}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High-Fidelity Winners Gallery */}
        {finalistPhotos.length > 0 && (
          <section className="animate-fade" style={{ marginBottom: '10rem' }}>
            <div className="glass" style={{ padding: '5rem', border: '1px solid rgba(0,0,0,0.05)', background: 'white', borderRadius: '3.5rem', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem', flexWrap: 'wrap', gap: '2rem' }}>
                <div>
                  <div style={{ letterSpacing: '0.4em', color: 'rgba(0,0,0,0.3)', fontWeight: 900, fontSize: '0.65rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>CLIENT CURATION</div>
                  <h2 className="text-signature" style={{ fontSize: '3rem', marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>THE SELECTION</h2>
                  <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: '1.1rem', fontWeight: 600 }}>Archival-ready assets approved by the client.</p>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <button 
                    onClick={handleDownloadRaw}
                    disabled={downloading}
                    className="btn-primary" 
                    style={{ background: 'black', color: 'white', padding: '1.25rem 2.5rem' }}
                  >
                    {downloading ? 'PROCESSING...' : 'SYNC ARCHIVE TO VAULT'}
                  </button>
                  <button 
                    onClick={() => {
                      const filenames = finalistPhotos.map(p => {
                        const parts = p.url.split('/');
                        const fullName = parts[parts.length - 1]; 
                        return fullName.split('-').slice(1).join('-'); 
                      });
                      navigator.clipboard.writeText(filenames.join(', '));
                      alert(`Successfully copied ${filenames.length} filenames!`);
                    }}
                    className="btn-secondary"
                    style={{ padding: '1.25rem 2.5rem' }}
                  >
                    IDENTIFIER LIST
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '3rem' }}>
                {finalistPhotos.map((photo, idx) => {
                  const selectedBy = selections.filter(s => s.photo_id === photo.id);
                  return (
                    <div key={'final-' + photo.id} className="animate-pop" style={{ position: 'relative', aspectRatio: '1', borderRadius: '2rem', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.06)', animationDelay: `${idx * 0.05}s` }}>
                      <img src={photo.thumbnail_url} alt="Winner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="glass" style={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: 'black', padding: '0.75rem 1rem', borderRadius: '1.25rem', fontSize: '0.75rem', fontWeight: 900, textAlign: 'center', background: 'white', border: '1px solid rgba(0,0,0,0.05)', letterSpacing: '0.05em' }}>
                        {selectedBy.map(s => s.user_name.toUpperCase()).join(' • ')}
                      </div>
                      
                      {/* REVOKE BUTTON */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRevokeSelection(photo.id);
                        }}
                        style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.9)', color: 'hsl(var(--danger))', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                        title="Remove from Selection"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Global Asset Library */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5rem' }}>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Archival Library</h2>
             <div className="glass-pill" style={{ background: 'white', color: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.05)', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em' }}>
               PORTAL: {`${window.location.origin}/gallery/${id}`}
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '4rem' }}>
            {photos.map((photo) => {
              const selectedBy = selections.filter(s => s.photo_id === photo.id);
              return (
                <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: '2.5rem', overflow: 'hidden', background: 'white', boxShadow: '0 15px 40px rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.03)' }}>
                  <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {selectedBy.length > 0 && (
                    <div className="flex-center animate-pop" style={{ position: 'absolute', top: 24, right: 24, background: 'black', color: 'white', padding: '0.75rem 1.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 900, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', letterSpacing: '0.05em' }}>
                      {selectedBy.length} {selectedBy.length === 1 ? 'SELECTION' : 'SELECTIONS'}
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.02) 0%, transparent 100%)', pointerEvents: 'none' }}></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
