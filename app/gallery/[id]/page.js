"use client";
import { useState, useEffect, use } from 'react';
import { Camera, Check, Lock, Sparkles, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function GalleryView({ params }) {
  const id = use(params).id;
  const pathname = usePathname();
  const [event, setEvent] = useState(null);
  const [photographer, setPhotographer] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selections, setSelections] = useState([]);
  const [userName, setUserName] = useState('');
  const isGallery = pathname?.includes('/gallery');
  const [isJoined, setIsJoined] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showFinalNotify, setShowFinalNotify] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedName = localStorage.getItem(`albumflow_name_${id}`);
    if (storedName) {
      setUserName(storedName);
      setIsJoined(true);
    }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Event not found");
      }
      const data = await res.json();
      setEvent(data.event);
      setPhotographer(data.photographer);
      setPhotos(data.photos || []);
      setSelections(data.selections || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    localStorage.setItem(`albumflow_name_${id}`, nameInput);
    setUserName(nameInput);
    setIsJoined(true);
  };

  const toggleSelection = async (photoId) => {
    if (event?.is_finalized) return alert("Album is final. No further changes allowed.");

    // Optimistically update
    const isSelectedByMe = selections.find(s => s.photo_id === photoId && s.user_name === userName);
    if (isSelectedByMe) {
      setSelections(prev => prev.filter(s => s.id !== isSelectedByMe.id));
    } else {
        if (selections.length >= event.max_selections) return alert("Max selections reached");
        setSelections(prev => [...prev, { id: 'temp', photo_id: photoId, user_name: userName }]);
    }

    try {
      const res = await fetch(`/api/events/${id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, userName })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      }
      fetchData(); 
    } catch (e) {
      fetchData(); 
    }
  };

  const handleFinalize = async () => {
    if (confirm("Are you sure you want to finalize? This will lock the album for everyone.")) {
      const res = await fetch(`/api/events/${id}/finalize`, { method: 'POST' });
      if (res.ok) {
        setShowFinalNotify(true);
        fetchData();
      }
    }
  };

  if (error) return (
    <div className="container flex-center animate-fade" style={{ minHeight: '100vh', flexDirection: 'column', background: '#EFE6DE' }}>
      <div className="glass-alive" style={{ padding: '4rem', textAlign: 'center', maxWidth: '440px' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '2rem', color: '#9A0002', fontWeight: 900 }}>Gallery Unavailable</h2>
        <p style={{ color: 'rgba(26, 26, 26, 0.5)', marginBottom: '2.5rem' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
      </div>
    </div>
  );

  if (!event) return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem', background: '#EFE6DE' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(154, 0, 2, 0.1)', borderTopColor: '#9A0002', borderRadius: '50%' }}></div>
      <span style={{ fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', fontSize: '0.75rem' }}>INITIALIZING ATELIER...</span>
    </div>
  );

  if (!isJoined) {
    return (
      <div className="flex-center animate-fade" style={{ minHeight: '100vh', background: '#EFE6DE', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          <div className="animate-pop" style={{ marginBottom: '4.5rem' }}>
              {photographer?.image ? (
                <div style={{ marginBottom: '2.5rem' }}>
                    <img src={photographer.image} alt="Studio Logo" style={{ height: '90px', maxWidth: '280px', objectFit: 'contain', margin: '0 auto', mixBlendMode: 'multiply' }} />
                   {/* Studio Name added below logo per request */}
                   <div style={{ marginTop: '2rem', fontSize: '0.8rem', fontWeight: 900, color: '#9A0002', letterSpacing: '0.4em' }}>{photographer.company_name?.toUpperCase() || photographer.name?.toUpperCase()}</div>
                </div>
              ) : (
                <div className="flex-center" style={{ width: '120px', height: '120px', borderRadius: '2.5rem', background: 'white', color: '#9A0002', margin: '0 auto', border: '1px solid rgba(154, 0, 2, 0.1)', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
                  <Camera size={56} />
                </div>
             )}
          </div>

          <div className="glass-alive" style={{ padding: '5rem 4rem', background: 'white', borderRadius: '2rem' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#9A0002' }}>{event.name}</h1>
            <p style={{ color: 'rgba(26, 26, 26, 0.4)', marginBottom: '4rem', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.2em' }}>CURATION BY {photographer?.company_name?.toUpperCase()}</p>
            
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'rgba(26, 26, 26, 0.4)', marginLeft: '0.5rem', marginBottom: '1rem', display: 'block', letterSpacing: '0.2em' }}>GUEST IDENTITY</label>
                <input 
                  type="text" required placeholder="YOUR FULL NAME"
                  style={{ width: '100%', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(154, 0, 2, 0.1)', background: '#F9F7F5', color: '#1a1a1a', fontSize: '1.1rem', fontWeight: 600 }}
                  className="input-focus"
                  value={nameInput} onChange={e => setNameInput(e.target.value)} 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.5rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                ENTER ATELIER <ChevronRight size={18} />
              </button>
            </form>
          </div>

          <div style={{ marginTop: '5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', opacity: 0.4 }}>
            <span style={{ color: '#9A0002', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              icolors@software
            </span>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.6em', fontWeight: 900, color: '#9A0002' }}>PLATFORM</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ minHeight: '100vh', paddingBottom: '180px', background: '#EFE6DE' }}>
      <style>{`
        @media (max-width: 768px) {
          .gallery-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important; gap: 1.5rem !important; padding: 0 1rem !important; }
          .hero-title { font-size: 2.75rem !important; }
          .hero-logo-img { height: 80px !important; margin-bottom: 2rem !important; }
          .nav-pill { margin: 1rem !important; padding: 1rem 1.5rem !important; top: 1rem !important; }
          .nav-logo-img { height: 28px !important; }
          .hero-section { min-height: 50vh !important; padding: 6rem 1.5rem 4rem !important; }
          .floating-controller { bottom: 0 !important; left: 0 !important; right: 0 !important; transform: none !important; width: 100% !important; min-width: 0 !important; padding: 1.5rem !important; flex-direction: column !important; gap: 1rem !important; border-radius: 0 !important; border-top: 1px solid rgba(154, 0, 2, 0.1) !important; }
          .counter-section { width: 100%; text-align: center; }
          .finalize-btn { width: 100%; padding: 1.25rem !important; }
          .footer-logo-img { height: 70px !important; }
        }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 4rem; padding: 0 4rem; }
        .nav-pill { 
          position: sticky; top: 2rem; z-index: 100; margin: 0 4rem; 
          border-radius: 1.5rem; padding: 1.25rem 3rem; 
          background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); 
          border: 1px solid rgba(154, 0, 2, 0.1); max-width: 1400px; 
          margin-left: auto; margin-right: auto; box-shadow: 0 20px 40px rgba(0,0,0,0.05); 
        }
      `}</style>

      {/* Persistent Platform Branding Overlay */}
      <div style={{ position: 'fixed', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 200, pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', opacity: 0.3 }}>
        <span style={{ color: '#9A0002', fontWeight: 900, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          icolors@software
        </span>
        <div style={{ fontSize: '0.55rem', letterSpacing: '0.4em', fontWeight: 900, color: '#9A0002' }}>ATELIER</div>
      </div>

      {/* Editorial Studio Hero */}
      <section className="hero-section" style={{ 
        minHeight: '60vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        textAlign: 'center', 
        position: 'relative',
        padding: '10rem 2rem 6rem'
      }}>
          <div className="animate-pop" style={{ position: 'relative', zIndex: 1, maxWidth: '1000px' }}>
            {photographer?.image ? (
              <div style={{ marginBottom: '4rem' }}>
                 <img src={photographer.image} className="hero-logo-img" alt="Studio Logo" style={{ height: '120px', maxWidth: '350px', objectFit: 'contain', margin: '0 auto', mixBlendMode: 'multiply' }} />
                 <div style={{ marginTop: '2rem', textTransform: 'uppercase', letterSpacing: '0.8em', fontSize: '1rem', fontWeight: 900, color: '#9A0002', opacity: 1 }}>{photographer?.company_name?.toUpperCase() || photographer?.name?.toUpperCase()}</div>
                 <div style={{ width: '80px', height: '1px', background: '#9A0002', margin: '2rem auto 0', opacity: 0.2 }}></div>
              </div>
            ) : (
              <h4 style={{ textTransform: 'uppercase', letterSpacing: '0.8em', fontSize: '1.2rem', marginBottom: '4rem', fontWeight: 900, color: '#9A0002' }}>{photographer?.company_name?.toUpperCase() || photographer?.name?.toUpperCase()}</h4>
            )}
            
            <h1 className="hero-title" style={{ fontSize: 'clamp(3.5rem, 8vw, 6.5rem)', fontWeight: 900, color: '#9A0002', marginBottom: '2rem', letterSpacing: '-0.04em', lineHeight: 0.95 }}>{event.name}</h1>
            
            <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem' }}>
              <div style={{ height: '1px', width: '30px', background: '#9A0002', opacity: 0.2 }}></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', opacity: 0.6 }}>PRIVATE COLLECTION</span>
              <div style={{ height: '1px', width: '30px', background: '#9A0002', opacity: 0.2 }}></div>
            </div>
          </div>
      </section>

      {/* Subdued Editorial Nav with permanent platform logo */}
      <header className="nav-pill animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <span style={{ color: '#9A0002', fontWeight: 900, fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              icolors@software
            </span>
          </Link>
          <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4rem', color: '#9A0002', opacity: 0.5 }}>{event.name}</span>
        </div>
      </header>

      <div style={{ marginTop: '10rem' }}>
        <div className="gallery-grid">
          {photos.map((photo, index) => {
            const photoSelections = selections.filter(s => s.photo_id === photo.id);
            const iSelectedIt = photoSelections.find(s => s.user_name === userName);

            return (
              <div 
                key={photo.id} 
                onClick={() => toggleSelection(photo.id)}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                className="animate-pop glass-alive"
                style={{ 
                  position: 'relative', 
                  aspectRatio: '1', 
                  borderRadius: '1.5rem', 
                  overflow: 'hidden', 
                  background: 'white', 
                  cursor: event.is_finalized ? 'default' : 'pointer',
                  animationDelay: `${index * 0.05}s`,
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: iSelectedIt ? '0 30px 60px rgba(154, 0, 2, 0.2)' : '0 10px 30px rgba(0,0,0,0.03)',
                  border: iSelectedIt ? '3px solid #9A0002' : '1px solid rgba(154, 0, 2, 0.05)',
                  userSelect: 'none'
                }}
              >
                <img 
                  src={photo.url} 
                  alt="Gallery Asset" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    transition: 'transform 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: iSelectedIt ? 'scale(1.05)' : 'scale(1)',
                    opacity: iSelectedIt ? 1 : 0.9,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    WebkitUserDrag: 'none'
                  }} 
                />
                
                {/* Horizontal Studio Watermark Overlay (50% Opacity) */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '90%',
                  textAlign: 'center',
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 10,
                  opacity: 0.5,
                  color: 'white',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.75), 0 1px 2px rgba(0, 0, 0, 0.5)',
                  fontSize: 'clamp(1rem, 4vw, 1.8rem)',
                  fontWeight: 900,
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {photographer?.company_name || photographer?.name || 'STUDIO'}
                </div>
                
                {iSelectedIt && (
                  <div className="flex-center animate-pop" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', width: '48px', height: '48px', background: '#9A0002', color: 'white', borderRadius: '50%', boxShadow: '0 10px 20px rgba(154, 0, 2, 0.4)', zIndex: 20 }}>
                    <Check size={28} strokeWidth={4} />
                  </div>
                )}

                {photoSelections.length > 0 && (
                  <div style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', right: '1.5rem', zIndex: 20 }}>
                    <div style={{ display: 'inline-flex', padding: '0.6rem 1.2rem', borderRadius: '0.75rem', fontSize: '0.65rem', fontWeight: 900, background: 'rgba(255,255,255,0.9)', color: '#9A0002', border: '1px solid rgba(154, 0, 2, 0.1)', letterSpacing: '0.1em', backdropFilter: 'blur(10px)' }}>
                      {photoSelections.map(s => s.user_name === userName ? 'YOU' : s.user_name.toUpperCase()).join(' • ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Signature Studio Footer */}
      <footer style={{ marginTop: '15rem', textAlign: 'center', padding: '10rem 2.5rem', borderTop: '1px solid rgba(154, 0, 2, 0.1)', position: 'relative', background: 'white' }}>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '4rem', opacity: 0.4 }}>
            <span style={{ color: '#9A0002', fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              icolors@software
            </span>
            <div style={{ color: '#9A0002', fontSize: '0.65rem', letterSpacing: '0.4em', fontWeight: 900 }}>SIGNATURE SYSTEM</div>
          </div>
         {photographer?.image ? (
            <img src={photographer.image} className="footer-logo-img" alt="Studio Signature" style={{ height: '100px', maxWidth: '300px', objectFit: 'contain', margin: '0 auto', mixBlendMode: 'multiply' }} />
         ) : (
           <h3 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#9A0002' }}>{photographer?.company_name || photographer?.name}</h3>
         )}
         <div style={{ width: '40px', height: '2px', background: '#9A0002', margin: '4rem auto', opacity: 0.1 }}></div>
         <p style={{ color: 'rgba(26, 26, 26, 0.5)', fontSize: '1.1rem', fontWeight: 600, maxWidth: '600px', margin: '0 auto', lineHeight: 1.8 }}>
           Bespoke photography curation for elite studios. This collection is private and proprietary.
         </p>
      </footer>

      {/* Editorial Floating Controller */}
      <div className="animate-fade floating-controller" style={{ 
        position: 'fixed', 
        bottom: '3rem', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        padding: '0.75rem 0.75rem 0.75rem 2.5rem', 
        borderRadius: '1.5rem', 
        zIndex: 100, 
        display: 'flex',
        alignItems: 'center',
        gap: '4rem', 
        width: 'auto',
        minWidth: '400px',
        maxWidth: '90vw',
        justifyContent: 'space-between', 
        boxShadow: '0 30px 60px rgba(154, 0, 2, 0.15)',
        border: '1px solid rgba(154, 0, 2, 0.1)',
        background: 'white',
        backdropFilter: 'blur(40px)'
      }}>
        <div className="counter-section">
          <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#9A0002' }}>{selections.filter(s => s.user_name === userName).length}</span>
          <span style={{ color: 'rgba(26, 26, 26, 0.4)', marginLeft: '1rem', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.1em' }}>SELECTED FOR SYNC</span>
        </div>
        
        <button 
          onClick={() => setShowFinalNotify(true)}
          className="btn-primary finalize-btn" 
        >
          {event.is_finalized ? 'ARCHIVE LOCKED' : 'FINALIZE CURATION'}
        </button>
      </div>

      {showFinalNotify && (
        <div className="flex-center animate-fade" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(239, 230, 222, 0.95)', backdropFilter: 'blur(20px)', padding: '2rem' }}>
          <div className="glass-alive animate-pop" style={{ maxWidth: '500px', width: '100%', padding: '5rem 4rem', textAlign: 'center', background: 'white', border: '1px solid rgba(154, 0, 2, 0.1)', borderRadius: '2rem' }}>
            <div className="flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(154, 0, 2, 0.05)', color: '#9A0002', margin: '0 auto 3rem' }}>
              <Check size={48} strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.04em', color: '#9A0002' }}>Finalize?</h2>
            <p style={{ color: 'rgba(26, 26, 26, 0.5)', marginBottom: '4rem', lineHeight: '1.7', fontSize: '1.1rem', fontWeight: 500 }}>
               This will lock your curation and notify **{photographer?.company_name}** instantly.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <button 
                onClick={() => {
                  handleFinalize();
                  setShowFinalNotify(false);
                }}
                className="btn-primary" 
                style={{ width: '100%', padding: '1.5rem', fontSize: '1rem' }}
              >
                CONFIRM CURATION
              </button>
              <button onClick={() => setShowFinalNotify(false)} className="btn-secondary" style={{ width: '100%', padding: '1.5rem', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <X size={18} /> REVISE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
