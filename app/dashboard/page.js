"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', max_selections: 9999 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch events from our new AWS-backed API
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
      
      // Fetch profile for branding from our new AWS-backed API
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const p = await profileRes.json();
        setProfile(p);
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm("Are you sure you want to delete this event? All tracked selections and database ties will be permanently erased!")) return;
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
    if (res.ok) {
      setIsCreating(false);
      setNewEvent({ name: '', max_selections: 9999 });
      fetchData();
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '50vh' }}>Loading...</div>;

  return (
    <div className="animate-fade" style={{ background: 'var(--background)', minHeight: '100vh', padding: '6rem 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8rem' }}>
          <div>
            <div style={{ letterSpacing: '0.5em', color: 'rgba(0,0,0,0.2)', fontWeight: 900, fontSize: '0.7rem', marginBottom: '2.5rem', textTransform: 'uppercase' }}>
              OFFICIAL ATELIER
            </div>
            <h2 className="text-signature" style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              {profile?.company_name || 'STUDIO'}
            </h2>
            <h1 style={{ fontSize: '6rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.06em', lineHeight: 0.9 }}>COLLECTIONS</h1>
            <p style={{ color: 'rgba(0,0,0,0.3)', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.01em', marginTop: '1.5rem' }}>Curating the archives with high-fidelity precision.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)} 
            className="btn-primary"
            style={{ padding: '1.25rem 3rem', fontSize: '0.9rem' }}
          >
            <Plus size={22} strokeWidth={4} /> NEW COLLECTION
          </button>
        </div>

        {/* Cinematic Create Form */}
        {isCreating && (
          <div className="glass animate-pop" style={{ padding: '5rem', marginBottom: '6rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '2.5rem', marginBottom: '3.5rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Begin New Archive</h3>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '4rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '1.25rem', color: 'rgba(0,0,0,0.3)', letterSpacing: '0.2em' }}>COLLECTION NAME</label>
                <input 
                  type="text" required 
                  style={{ width: '100%', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--background)', color: 'black', fontSize: '1.1rem', fontWeight: 600 }} 
                  className="input-focus"
                  value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} 
                  placeholder="e.g. Modern Minimalist Wedding"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '1.25rem', color: 'rgba(0,0,0,0.3)', letterSpacing: '0.2em' }}>SELECTION QUOTA</label>
                <input 
                  type="number" required 
                  style={{ width: '100%', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--background)', color: 'black', fontSize: '1.1rem', fontWeight: 600 }} 
                  className="input-focus"
                  value={newEvent.max_selections} onChange={e => setNewEvent({...newEvent, max_selections: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 2, padding: '1.5rem' }}>LAUNCH ARCHIVE</button>
                <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary" style={{ flex: 1, padding: '1.5rem' }}>CANCEL</button>
              </div>
            </form>
          </div>
        )}

        {/* Collection Grid - Editorial Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '4rem' }}>
          {events.map((ev, index) => (
            <Link href={`/dashboard/${ev.id}`} key={ev.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div 
                className="glass animate-pop" 
                style={{ 
                  padding: '4rem 3.5rem', 
                  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)', 
                  cursor: 'pointer',
                  animationDelay: `${index * 0.1}s`,
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.03)',
                  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-12px)';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                  e.currentTarget.style.boxShadow = '0 40px 80px -20px rgba(0,0,0,0.08)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.03)';
                  e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.03)';
                }}
              >
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteEvent(ev.id); }} 
                  style={{ position: 'absolute', top: 32, right: 32, color: 'rgba(0,0,0,0.1)', transition: 'all 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'hsl(var(--danger))'}
                  onMouseOut={e => e.currentTarget.style.color = 'rgba(0,0,0,0.1)'}
                >
                  <Trash2 size={20} strokeWidth={2.5} />
                </button>
                
                <h3 style={{ fontSize: '2.25rem', marginBottom: '3rem', paddingRight: '3rem', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-0.03em' }}>{ev.name}</h3>
                
                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                   <div style={{ 
                     padding: '0.65rem 1.5rem', 
                     borderRadius: '999px', 
                     fontSize: '0.7rem', 
                     fontWeight: 900, 
                     letterSpacing: '0.15em',
                     textTransform: 'uppercase',
                     background: ev.is_finalized ? 'rgba(52, 211, 153, 0.08)' : 'var(--background)',
                     color: ev.is_finalized ? '#059669' : 'rgba(0,0,0,0.4)',
                     border: '1px solid rgba(0,0,0,0.05)'
                   }}>
                     {ev.is_finalized ? 'Finalized' : 'In Selection'}
                   </div>
                   <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'rgba(0,0,0,0.2)', letterSpacing: '0.05em' }}>
                     {ev.max_selections} CAP
                   </div>
                </div>

                {/* Editorial Accent Line */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', background: 'var(--primary)', opacity: 0.05 }}></div>
              </div>
            </Link>
          ))}
          
          {events.length === 0 && !isCreating && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '12rem 2rem', color: 'rgba(0,0,0,0.1)', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '2.5rem' }}>
              <ImageIcon size={64} strokeWidth={1} style={{ marginBottom: '2.5rem', opacity: 0.2 }} />
              <p style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'rgba(0,0,0,0.3)' }}>Your archive is silent. Begin your first collection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
