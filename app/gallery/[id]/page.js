"use client";
import { useState, useEffect, use } from 'react';
import { Camera, Check, Lock } from 'lucide-react';

export default function GalleryView({ params }) {
  const id = use(params).id;
  const [event, setEvent] = useState(null);
  const [photographer, setPhotographer] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [selections, setSelections] = useState([]);
  const [userName, setUserName] = useState('');
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
        // Assume append optimistic
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
      fetchData(); // Sync exact server state silently
    } catch (e) {
      fetchData(); // rollback on network error
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
    <div className="container flex-center animate-fade" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div className="glass" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ color: 'hsl(var(--danger))', marginBottom: '1rem' }}>Gallery Unavailable</h2>
        <p style={{ color: 'hsl(var(--muted))', marginBottom: '2rem' }}>{error}</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">Retry</button>
      </div>
    </div>
  );

  if (!event) return <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
    <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid hsla(var(--primary), 0.1)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%' }}></div>
    <span style={{ fontWeight: 600, color: 'hsl(var(--muted))' }}>Curating Experience...</span>
  </div>;

  if (!isJoined) {
    return (
      <div className="container flex-center animate-fade" style={{ minHeight: '100vh', background: 'hsl(var(--background))' }}>
        <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
          {/* Logo Showcase - Premium VIP Entry */}
          <div className="animate-pop" style={{ marginBottom: '4rem' }}>
             {photographer?.logo_url ? (
               <div style={{ position: 'relative', display: 'inline-block' }}>
                 <img src={photographer.logo_url} alt="Studio Logo" style={{ height: '100px', maxWidth: '240px', objectFit: 'contain', margin: '0 auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.05))' }} />
                 <div style={{ position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)', width: '40px', height: '2px', background: 'hsl(var(--primary))', opacity: 0.3 }}></div>
               </div>
             ) : (
                <div className="flex-center" style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', margin: '0 auto' }}>
                  <Camera size={36} />
                </div>
             )}
          </div>

          <div className="glass" style={{ padding: '4rem 3rem', borderRadius: '2.5rem', border: '1px solid hsla(var(--primary), 0.1)' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-0.03em' }}>{event.name}</h1>
            <p style={{ color: 'hsl(var(--muted))', marginBottom: '3rem', fontSize: '1.1rem', fontWeight: 500 }}>A curated collection by <span style={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}>{photographer?.company_name || 'Professional Studio'}</span></p>
            
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'hsl(var(--muted))', marginLeft: '0.75rem', marginBottom: '0.75rem', display: 'block', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Guest Identity</label>
                <input 
                  type="text" required placeholder="Full Name"
                  style={{ width: '100%', padding: '1.25rem', borderRadius: '1.2rem', border: '1.5px solid hsl(var(--border))', background: 'hsl(var(--surface))', color: 'hsl(var(--foreground))', fontSize: '1.1rem', fontWeight: 600, transition: 'all 0.3s ease' }}
                  className="input-focus"
                  value={nameInput} onChange={e => setNameInput(e.target.value)} 
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '1.25rem', justifyContent: 'center', fontSize: '1.1rem', borderRadius: '1.2rem', boxShadow: '0 20px 40px -10px hsla(var(--primary), 0.3)' }}>Enter Collection</button>
            </form>
          </div>

          <p style={{ marginTop: '4rem', fontSize: '0.75rem', color: 'hsl(var(--muted))', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 }}>
            SECURED BY **ALBUMFLOW AI**
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade" style={{ background: 'var(--background)', minHeight: '100vh', paddingBottom: '160px', color: 'var(--foreground)' }}>
      <style>{`
        @media (max-width: 768px) {
          .gallery-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important; gap: 1rem !important; padding: 0 1rem !important; }
          .hero-title { font-size: 3rem !important; }
          .hero-logo-img { height: 80px !important; }
          .nav-pill { margin: 0 1rem !important; padding: 0.5rem 1.5rem !important; top: 1rem !important; }
          .nav-logo-img { height: 32px !important; }
          .hero-section { height: 45vh !important; }
          .footer-logo-img { height: 80px !important; }
        }
        .gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 4rem; }
        .nav-pill { 
          position: sticky; top: 2rem; z-index: 100; margin: 0 2rem; 
          border-radius: 999px; padding: 1rem 3rem; 
          background: rgba(255,255,255,0.7); backdrop-filter: blur(25px); 
          border: 1px solid rgba(0,0,0,0.05); max-width: 1200px; 
          margin-left: auto; margin-right: auto; box-shadow: 0 20px 50px -10px rgba(0,0,0,0.05); 
        }
      `}</style>

      {/* Immersive Editorial Hero */}
      <section className="hero-section" style={{ 
        height: '50vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        textAlign: 'center', 
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(circle at center, hsla(35, 40%, 95%, 1) 0%, var(--background) 100%)'
      }}>
          <div className="animate-pop" style={{ position: 'relative', zIndex: 1, padding: '0 2rem' }}>
            {photographer?.logo_url ? (
              <div style={{ marginBottom: '3rem' }}>
                 <img src={photographer.logo_url} className="hero-logo-img" alt="Studio Logo" style={{ height: '220px', maxWidth: '480px', objectFit: 'contain', filter: 'drop-shadow(0 15px 40px rgba(0,0,0,0.04))' }} />
                 <div style={{ width: '60px', height: '1px', background: 'black', margin: '3rem auto', opacity: 0.1 }}></div>
              </div>
            ) : (
              <h4 className="text-signature" style={{ textTransform: 'uppercase', letterSpacing: '0.6em', fontSize: '1.2rem', marginBottom: '3rem', fontWeight: 900 }}>{photographer?.company_name?.toUpperCase()}</h4>
            )}
            
            <h1 className="hero-title" style={{ fontSize: '6.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.06em', lineHeight: 0.9 }}>{event.name}</h1>
            <div style={{ marginTop: '2.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 900, opacity: 0.2, letterSpacing: '0.5em', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>PRESENTED BY</span>
              <span className="text-signature" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{photographer?.company_name}</span>
            </div>
          </div>
      </section>

      {/* Editorial Floating Nav */}
      <header className="nav-pill animate-fade">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {photographer?.logo_url && (
              <img src={photographer.logo_url} className="nav-logo-img" alt="Logo" style={{ height: '48px', width: 'auto', maxWidth: '180px', objectFit: 'contain' }} />
            )}
            <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'rgba(0,0,0,0.3)' }}>{event.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'right' }}>
               <div style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.3, letterSpacing: '0.1em' }}>GUEST</div>
               <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{userName}</div>
            </div>
            {event.is_finalized && (
              <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', color: 'black' }}>
                <Lock size={18} />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container" style={{ marginTop: '8rem' }}>
        <div className="gallery-grid">
          {photos.map((photo, index) => {
            const photoSelections = selections.filter(s => s.photo_id === photo.id);
            const iSelectedIt = photoSelections.find(s => s.user_name === userName);

            return (
              <div 
                key={photo.id} 
                onClick={() => toggleSelection(photo.id)}
                className="animate-pop"
                style={{ 
                  position: 'relative', 
                  aspectRatio: '1', 
                  borderRadius: '2rem', 
                  overflow: 'hidden', 
                  background: 'white', 
                  cursor: event.is_finalized ? 'default' : 'pointer',
                  animationDelay: `${index * 0.05}s`,
                  transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: iSelectedIt ? '0 30px 60px -10px rgba(0,0,0,0.1)' : '0 10px 30px -15px rgba(0,0,0,0.05)'
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
                    opacity: iSelectedIt ? 1 : 0.95
                  }} 
                />
                
                {iSelectedIt && (
                  <div style={{ position: 'absolute', inset: 0, border: '4px solid black', borderRadius: '2rem', pointerEvents: 'none', zIndex: 10 }}></div>
                )}

                {iSelectedIt && (
                  <div className="flex-center animate-pop" style={{ position: 'absolute', top: '10%', right: '10%', width: '48px', height: '48px', background: 'black', color: 'white', borderRadius: '50%', boxShadow: '0 15px 30px rgba(0,0,0,0.2)', zIndex: 20 }}>
                    <Check size={24} strokeWidth={4} />
                  </div>
                )}

                {photoSelections.length > 0 && (
                  <div style={{ position: 'absolute', bottom: '10%', left: '10%', right: '10%', zIndex: 20 }}>
                    <div className="glass" style={{ display: 'inline-flex', padding: '0.6rem 1.25rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, background: 'white', border: '1px solid rgba(0,0,0,0.05)', letterSpacing: '0.05em' }}>
                      {photoSelections.map(s => s.user_name === userName ? 'ME' : s.user_name.toUpperCase()).join(' • ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Luxury Signature Footer */}
      <footer style={{ marginTop: '15rem', textAlign: 'center', padding: '12rem 2rem', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
         <div style={{ color: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', letterSpacing: '0.5em', marginBottom: '4rem', fontWeight: 900 }}>
            PRESENTED BY
         </div>
         {photographer?.logo_url ? (
           <img src={photographer.logo_url} className="footer-logo-img" alt="Studio Signature" style={{ height: '140px', maxWidth: '400px', objectFit: 'contain', opacity: 1 }} />
         ) : (
           <h3 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>{photographer?.company_name}</h3>
         )}
         <div style={{ width: '60px', height: '1px', background: 'black', margin: '4rem auto', opacity: 0.05 }}></div>
         <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: '1.15rem', fontWeight: 600, maxWidth: '550px', margin: '0 auto', lineHeight: 1.8, letterSpacing: '0.01em' }}>
           Capturing life through an artistic lens. This curated collection is proprietary to {photographer?.company_name}.
         </p>
      </footer>

      {/* Floating Action Controller */}
      <div className="glass animate-fade" style={{ 
        position: 'fixed', 
        bottom: '3rem', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        padding: '0.75rem 0.75rem 0.75rem 2rem', 
        borderRadius: '999px', 
        zIndex: 100, 
        display: 'flex',
        alignItems: 'center',
        gap: '3rem', 
        width: 'auto',
        minWidth: '380px',
        maxWidth: '90vw',
        justifyContent: 'space-between', 
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.05)',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(40px)'
      }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
          <span style={{ color: 'black', fontSize: '1.35rem', fontWeight: 900 }}>{selections.filter(s => s.user_name === userName).length}</span>
          <span style={{ color: 'rgba(0,0,0,0.4)', marginLeft: '1rem' }}>FAVORITES SELECTED</span>
        </div>
        
        <button 
          onClick={() => setShowFinalNotify(true)}
          className="btn-primary" 
          style={{ borderRadius: '999px', padding: '1rem 2.25rem', fontSize: '0.85rem', fontWeight: 900 }}
        >
          {event.is_finalized ? 'LOCKED' : 'FINALIZE SELECTION'}
        </button>
      </div>

      {showFinalNotify && (
        <div className="flex-center animate-fade" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', padding: '1rem' }}>
          <div className="glass animate-pop" style={{ maxWidth: '480px', width: '100%', padding: '4rem 3rem', textAlign: 'center', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '3rem' }}>
            <div className="flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', color: 'black', margin: '0 auto 2.5rem' }}>
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>Finalize Collection?</h2>
            <p style={{ color: 'rgba(0,0,0,0.5)', marginBottom: '3rem', lineHeight: '1.8', fontSize: '1.15rem', fontWeight: 500 }}>
               This will confirm your selection to the studio. <strong>{photographer?.company_name}</strong> will be notified.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <button 
                onClick={() => {
                  alert("Selection Sent! Your photographer will be notified.");
                  setShowFinalNotify(false);
                }}
                className="btn-primary" 
                style={{ width: '100%', padding: '1.5rem', fontSize: '1rem', borderRadius: '1.5rem', justifyContent: 'center' }}
              >
                CONFIRM SELECTION
              </button>
              <button onClick={() => setShowFinalNotify(false)} className="btn-secondary" style={{ width: '100%', padding: '1.5rem', fontSize: '1rem', borderRadius: '1.5rem', justifyContent: 'center' }}>KEEP SELECTING</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
;
}
