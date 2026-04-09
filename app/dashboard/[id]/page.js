"use client";
import { useState, useEffect, use } from 'react';
import { UploadCloud, ArrowLeft, Copy, Zap, Shield, Sparkles, ChevronLeft, Check, X, FolderOpen } from 'lucide-react';
import Link from 'next/link';

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
      const res = await fetch(`/api/events/${id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, selected: false, guestName: 'Photographer' })
      });
      if (res.ok) {
        setSelections(prev => prev.filter(s => s.photo_id !== photoId));
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to remove selection");
      }
    } catch (err) {
       alert("Failed to remove selection: " + err.message);
    }
  };

  const handleDownloadRaw = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/events/${id}/gdrive/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: event.name })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.success) {
        alert(`🎉 Success! ${data.message || 'Selected photos have been archived to your Google Drive Winners folder.'}`);
      } else {
        alert("Sync completed but no photos were matched. Please check your Google Drive.");
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

    updateQueueItem(itemId, { status: 'compressing' });

    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(item.file, options);
      
      updateQueueItem(itemId, { status: 'uploading' });
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: item.file.name,
          contentType: item.file.type,
          eventId: id
        })
      });
      
      const { uploadUrl, key, publicUrl, originalUploadUrl, originalKey } = await presignedRes.json();

      const uploadSuccess = await fetch(uploadUrl, {
        method: 'PUT',
        body: compressedFile,
        headers: { 'Content-Type': 'item.file.type' }
      });
      if (!uploadSuccess.ok) throw new Error("AWS S3 Upload Failed");

      const originalUpload = await fetch(originalUploadUrl, {
        method: 'PUT',
        body: item.file,
        headers: { 'Content-Type': 'item.file.type' }
      });

      updateQueueItem(itemId, { status: 'saving' });
      const photoRes = await fetch(`/api/events/${id}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: publicUrl,
          storage_path: key,
          original_storage_path: originalUpload.ok ? originalKey : null,
        })
      });

      if (!photoRes.ok) throw new Error("Database Metadata Sync Failed");
      const photoRecord = await photoRes.json();

      setPhotos(prev => [...prev, photoRecord]);
      updateQueueItem(itemId, { status: 'complete', progress: 100 });

    } catch (err) {
      console.error("Queue error:", err);
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

  if (!event) return (
    <div className="flex-center" style={{ minHeight: '100vh', gap: '2rem', flexDirection: 'column', background: '#EFE6DE' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(154, 0, 2, 0.1)', borderTopColor: '#9A0002', borderRadius: '50%' }}></div>
      <span style={{ fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', fontSize: '0.75rem' }}>OPENING VAULT...</span>
    </div>
  );

  const finalistPhotos = photos.filter(p => selections.some(s => s.photo_id === p.id));
  const completedCount = uploadQueue.filter(i => i.status === 'complete').length;
  const totalInQueue = uploadQueue.length;
  const overallProgress = totalInQueue > 0 ? Math.floor((completedCount / totalInQueue) * 100) : 0;

  return (
    <div className="animate-fade" style={{ minHeight: '100vh', padding: '6rem 0', background: '#EFE6DE' }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-header { margin-bottom: 4rem !important; }
          .dash-title { font-size: 3rem !important; }
          .production-hub { flex-direction: column !important; }
          .winners-grid, .archival-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 1.5rem !important; }
        }
        .scroll-hide::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Editorial Collection Header */}
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8rem', flexWrap: 'wrap', gap: '3rem' }}>
          <div className="animate-pop">
            <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9A0002', textDecoration: 'none', marginBottom: '2.5rem', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.2rem' }}>
              <ArrowLeft size={16} strokeWidth={3} /> RETURN TO CATALOG
            </Link>
            <h1 className="dash-title" style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em', fontWeight: 900, color: '#9A0002', lineHeight: 0.9 }}>{event.name}</h1>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em', background: 'white', color: '#9A0002', border: '1px solid rgba(154, 0, 2, 0.1)' }}>
                {selections.length} / {event.max_selections} SELECTIONS
              </div>
              {event.is_finalized && (
                <div style={{ padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 900, background: '#9A0002', color: 'white', letterSpacing: '0.1em' }}>ARCHIVE LOCKED</div>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/gallery/${id}`);
              alert("Client link copied to clipboard!");
            }} 
            className="btn-primary animate-pop" 
            style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
          >
            <Copy size={18} /> GUEST ACCESS
          </button>
        </div>

        {/* Editorial Production Hub */}
        <div className="glass-alive animate-pop production-hub" style={{ padding: '4rem', marginBottom: '8rem', background: 'white', borderRadius: '2rem', display: 'flex', gap: '4rem' }}>
          {/* Induction Zone */}
          <div style={{ flex: '1 1 300px', padding: '4rem 2rem', border: '1px dashed rgba(154, 0, 2, 0.2)', borderRadius: '1.5rem', textAlign: 'center' }}>
             <div className="flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(154, 0, 2, 0.05)', color: '#9A0002', margin: '0 auto 2.5rem' }}>
              <UploadCloud size={32} />
            </div>
            <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: 900, color: '#9A0002' }}>Production Console</h3>
            <p style={{ color: 'rgba(26, 26, 26, 0.4)', fontSize: '1rem', marginBottom: '3rem', fontWeight: 600 }}>Induct raw assets for curation.</p>
            <label className="btn-primary" style={{ cursor: 'pointer', padding: '1rem 3rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
              <Zap size={18} fill="currentColor" /> START UPLOAD
              <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>

          {/* Sync Status Overlay */}
          {uploadQueue.length > 0 && (
            <div style={{ flex: '2 1 500px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.3em', color: '#9A0002', opacity: 0.4, marginBottom: '0.75rem' }}>TRANSMISSION STATUS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1a1a1a' }}>{completedCount} / {totalInQueue} ASSETS SYNCED</div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#9A0002' }}>{overallProgress}%</div>
              </div>
              
              <div style={{ width: '100%', height: '8px', background: '#F9F7F5', borderRadius: '99px', overflow: 'hidden', marginBottom: '3rem' }}>
                <div style={{ width: `${overallProgress}%`, height: '100%', background: '#9A0002', transition: 'width 0.4s' }}></div>
              </div>

              <div className="scroll-hide" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {uploadQueue.slice().reverse().map(item => (
                   <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: '#F9F7F5', borderRadius: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.status === 'complete' ? '#9A0002' : 'rgba(26,26,26,0.1)' }}></div>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1a1a', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '300px' }}>{item.file.name.toUpperCase()}</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#9A0002', opacity: 0.5 }}>{item.status.toUpperCase()}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Winners Console */}
        {finalistPhotos.length > 0 && (
          <section style={{ marginBottom: '10rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', flexWrap: 'wrap', gap: '2rem' }}>
               <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.3em', color: '#9A0002', opacity: 0.4, marginBottom: '1.5rem' }}>GLOBAL SUBMISSIONS</div>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#9A0002', letterSpacing: '-0.03em' }}>Curated Winners</h2>
               </div>
               <button 
                onClick={handleDownloadRaw}
                disabled={downloading}
                className="btn-primary" 
                style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
               >
                 <Shield size={20} /> {downloading ? 'SYNCING ARCHIVE...' : 'EXPORT TO GOOGLE DRIVE'}
               </button>
            </div>

            <div className="winners-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '3rem' }}>
               {finalistPhotos.map((photo, idx) => {
                 const selectedBy = selections.filter(s => s.photo_id === photo.id);
                 return (
                   <div key={'final-' + photo.id} className="animate-pop glass-alive" style={{ position: 'relative', aspectRatio: '1', borderRadius: '1.5rem', overflow: 'hidden', background: 'white', animationDelay: `${idx * 0.05}s` }}>
                      <img src={photo.url} alt="Winner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', right: '1.25rem', padding: '0.75rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', textAlign: 'center', fontSize: '0.65rem', fontWeight: 900, color: '#9A0002', border: '1px solid rgba(154, 0, 2, 0.1)' }}>
                        {selectedBy.map(s => s.user_name.toUpperCase()).join(' • ')}
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRevokeSelection(photo.id); }}
                        style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'white', color: '#9A0002', border: '1px solid rgba(154, 0, 2, 0.1)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={16} />
                      </button>
                   </div>
                 );
               })}
            </div>
          </section>
        )}

        {/* Archival Collection Library */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4rem' }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#9A0002', letterSpacing: '-0.02em' }}>Archival Library</h2>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(26, 26, 26, 0.3)', letterSpacing: '0.1em' }}>{photos.length} TOTAL ASSETS</div>
          </div>

          <div className="archival-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '3rem' }}>
             {photos.map((photo) => {
               const selectedBy = selections.filter(s => s.photo_id === photo.id);
               return (
                 <div key={photo.id} className="glass-alive" style={{ position: 'relative', aspectRatio: '1', borderRadius: '2rem', overflow: 'hidden', background: 'white' }}>
                    <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                    {selectedBy.length > 0 && (
                      <div className="flex-center animate-pop" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#9A0002', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.7rem', fontWeight: 900, boxShadow: '0 10px 20px rgba(154, 0, 2, 0.2)' }}>
                        SELECTED
                      </div>
                    )}
                 </div>
               );
             })}

             {photos.length === 0 && (
               <div className="flex-center" style={{ gridColumn: '1 / -1', padding: '10rem 2rem', background: 'white', borderRadius: '2rem', border: '1px dashed rgba(154, 0, 2, 0.1)', flexDirection: 'column', gap: '2rem' }}>
                  <FolderOpen size={48} color="rgba(154, 0, 2, 0.2)" />
                  <p style={{ color: 'rgba(26, 26, 26, 0.3)', fontWeight: 800 }}>Library is currently empty.</p>
               </div>
             )}
          </div>
        </section>
      </div>
    </div>
  );
}
