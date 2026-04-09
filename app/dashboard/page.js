"use client";
import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Trash2, Zap, LayoutGrid, Sparkles, FolderOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
      
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

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh', gap: '2rem', flexDirection: 'column', background: '#EFE6DE' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(154, 0, 2, 0.1)', borderTopColor: '#9A0002', borderRadius: '50%' }}></div>
      <span style={{ fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', fontSize: '0.75rem' }}>OPENING ARCHIVES...</span>
    </div>
  );

  return (
    <div className="animate-fade" style={{ minHeight: '100vh', padding: '6rem 0', background: '#EFE6DE' }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-header { margin-bottom: 4rem !important; }
          .dash-title { font-size: 3.5rem !important; }
          .coll-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>
      
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8rem' }}>
          <div className="animate-pop">
            <div style={{ letterSpacing: '0.4em', color: '#9A0002', fontWeight: 900, fontSize: '0.75rem', marginBottom: '2.5rem', textTransform: 'uppercase', opacity: 0.6 }}>
               CONTROL CONSOLE
            </div>
            <h1 className="dash-title" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, color: '#9A0002', marginBottom: '1rem', letterSpacing: '-0.04em', lineHeight: 0.9 }}>CATALOG</h1>
            <p style={{ color: 'rgba(26, 26, 26, 0.5)', fontSize: '1.2rem', fontWeight: 600, marginTop: '1.5rem', maxWidth: '480px' }}>
              Precision management for the {profile?.company_name || 'Studio'} archives.
            </p>
          </div>
          <button 
            onClick={() => setIsCreating(true)} 
            className="btn-primary animate-pop"
            style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            <Plus size={20} /> NEW COLLECTION
          </button>
        </div>

        {/* Editorial Create Form */}
        {isCreating && (
          <div className="glass-alive animate-pop" style={{ padding: '4rem', marginBottom: '8rem', background: 'white', borderRadius: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3.5rem' }}>
               <Sparkles size={24} color="#9A0002" />
               <h3 style={{ fontSize: '2rem', color: '#9A0002', fontWeight: 900 }}>Create New Archive</h3>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem', color: 'rgba(26, 26, 26, 0.4)', letterSpacing: '0.2rem' }}>NAME</label>
                <input 
                  type="text" required 
                  style={{ width: '100%', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(154, 0, 2, 0.1)', background: '#F9F7F5', color: '#1a1a1a', fontSize: '1.1rem', fontWeight: 600 }} 
                  className="input-focus"
                  value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} 
                  placeholder="e.g. Summer Wedding 2026"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, marginBottom: '1rem', color: 'rgba(26, 26, 26, 0.4)', letterSpacing: '0.2rem' }}>SELECTION CAP</label>
                <input 
                  type="number" required 
                  style={{ width: '100%', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(154, 0, 2, 0.1)', background: '#F9F7F5', color: '#1a1a1a', fontSize: '1.1rem', fontWeight: 600 }} 
                  className="input-focus"
                  value={newEvent.max_selections} onChange={e => setNewEvent({...newEvent, max_selections: e.target.value})} 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>INITIALIZE</button>
                <button type="button" onClick={() => setIsCreating(false)} className="btn-secondary" style={{ flex: 1 }}>CANCEL</button>
              </div>
            </form>
          </div>
        )}

        {/* Collection Grid */}
        <div className="coll-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '3rem' }}>
          {events.map((ev, index) => (
            <Link href={`/dashboard/${ev.id}`} key={ev.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div 
                className="glass-alive animate-pop" 
                style={{ 
                  padding: '4rem 3rem', 
                  background: 'white',
                  borderRadius: '1.5rem',
                  position: 'relative',
                  border: '1px solid rgba(154, 0, 2, 0.05)',
                  animationDelay: `${index * 0.05}s`
                }}
              >
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteEvent(ev.id); }} 
                  style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'rgba(26, 26, 26, 0.1)', background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.color = '#9A0002'}
                  onMouseOut={e => e.currentTarget.style.color = 'rgba(26, 26, 26, 0.1)'}
                >
                  <Trash2 size={18} />
                </button>
                
                <h3 style={{ fontSize: '2.25rem', color: '#9A0002', marginBottom: '3rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>{ev.name}</h3>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ 
                     padding: '0.6rem 1.25rem', 
                     borderRadius: '0.75rem', 
                     fontSize: '0.7rem', 
                     fontWeight: 900, 
                     letterSpacing: '0.15em',
                     textTransform: 'uppercase',
                     background: ev.is_finalized ? 'rgba(154, 0, 2, 0.1)' : 'rgba(26, 26, 26, 0.03)',
                     color: ev.is_finalized ? '#9A0002' : 'rgba(26, 26, 26, 0.4)',
                   }}>
                     {ev.is_finalized ? 'LOCKED' : 'ACTIVE'}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9A0002', fontWeight: 800, fontSize: '0.8rem' }}>
                      VIEW <ChevronRight size={16} />
                   </div>
                </div>
              </div>
            </Link>
          ))}
          
          {events.length === 0 && !isCreating && (
            <div className="glass-alive flex-center" style={{ gridColumn: '1 / -1', padding: '12rem 2rem', background: 'white', borderRadius: '2rem', borderStyle: 'dashed', borderColor: 'rgba(154, 0, 2, 0.1)', flexDirection: 'column', gap: '2rem' }}>
              <FolderOpen size={48} color="rgba(154, 0, 2, 0.2)" />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#9A0002', marginBottom: '0.5rem' }}>No collections found.</p>
                <p style={{ color: 'rgba(26, 26, 26, 0.4)', fontWeight: 600 }}>Create your first archive to begin curating.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
