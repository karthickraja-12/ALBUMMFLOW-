"use client";
import { useState, useEffect } from 'react';
import { Check, X, Shield, Search, User, ShieldAlert, ChevronRight, UserCheck } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error("Admin fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId, currentStatus) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_approved: !currentStatus })
      });
      if (res.ok) fetchProfiles();
    } catch (e) {
      console.error("Approval update error:", e);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    if (!confirm(`Are you sure you want to change this user's role to ${currentRole === 'super_admin' ? 'Artisan' : 'Super Admin'}?`)) return;
    
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: currentRole === 'super_admin' ? 'photographer' : 'super_admin' })
      });
      if (res.ok) fetchProfiles();
    } catch (e) {
      console.error("Role update error:", e);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh', gap: '2rem', flexDirection: 'column', background: '#EFE6DE' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(154, 0, 2, 0.1)', borderTopColor: '#9A0002', borderRadius: '50%' }}></div>
      <span style={{ fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', fontSize: '0.75rem' }}>SYSTEM SCANNING...</span>
    </div>
  );

  return (
    <div className="animate-fade" style={{ background: '#EFE6DE', minHeight: '100vh', padding: '6rem 0' }}>
      <div className="container">
        
        {/* Editorial System Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8rem', flexWrap: 'wrap', gap: '3rem' }}>
          <div>
            <div style={{ letterSpacing: '0.4em', color: '#9A0002', fontWeight: 900, fontSize: '0.7rem', marginBottom: '2.5rem', textTransform: 'uppercase', opacity: 0.6 }}>SYSTEM GOVERNANCE</div>
            <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em', color: '#9A0002', fontWeight: 900, lineHeight: 0.9 }}>CONTROL</h1>
            <p style={{ color: 'rgba(26, 26, 26, 0.5)', fontSize: '1.2rem', fontWeight: 600, maxWidth: '480px' }}>Curation of the creative roster and platform level access.</p>
          </div>
          <div className="glass-alive" style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 2rem', gap: '1.5rem', width: '100%', maxWidth: '400px', background: 'white', borderRadius: '1.5rem', border: '1px solid rgba(154, 0, 2, 0.1)' }}>
            <Search size={20} color="#9A0002" />
            <input 
              type="text" placeholder="Search the Roster..." 
              style={{ border: 'none', background: 'transparent', color: '#1a1a1a', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: 600 }}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Editorial Data Table */}
        <div className="glass-alive animate-pop" style={{ overflowX: 'auto', background: 'white', borderRadius: '2rem', border: '1px solid rgba(154, 0, 2, 0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'rgba(154, 0, 2, 0.03)', borderBottom: '1px solid rgba(154, 0, 2, 0.05)' }}>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: '#9A0002', textTransform: 'uppercase', letterSpacing: '0.2em' }}>ARTISAN</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: '#9A0002', textTransform: 'uppercase', letterSpacing: '0.2em' }}>STUDIO</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: '#9A0002', textTransform: 'uppercase', letterSpacing: '0.2em' }}>ROLE</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: '#9A0002', textTransform: 'uppercase', letterSpacing: '0.2em' }}>STATUS</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: '#9A0002', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>COMMAND</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} style={{ borderBottom: '1px solid rgba(26, 26, 26, 0.03)', transition: 'background 0.4s' }} className="hover-row">
                  <td style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '1rem', background: '#F9F7F5', color: '#9A0002' }}>
                        <User size={18} strokeWidth={2.5} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                         <span style={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>{profile.name || 'Anonymous'}</span>
                         <span style={{ fontSize: '0.75rem', color: 'rgba(26, 26, 26, 0.4)', fontWeight: 600 }}>{profile.email}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '2rem', color: '#1a1a1a', fontWeight: 700, fontSize: '0.9rem' }}>{profile.company_name || '—'}</td>
                  <td style={{ padding: '2rem' }}>
                    <span style={{ padding: '0.4rem 1rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 900, background: profile.role === 'super_admin' ? '#9A0002' : '#F9F7F5', color: profile.role === 'super_admin' ? 'white' : 'rgba(26, 26, 26, 0.5)', letterSpacing: '0.1em' }}>
                      {profile.role === 'super_admin' ? 'SYSTEM OVERSEER' : 'ARTISAN'}
                    </span>
                  </td>
                  <td style={{ padding: '2rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: profile.is_approved ? '#1a1a1a' : 'rgba(26, 26, 26, 0.2)', fontWeight: 900, fontSize: '0.75rem' }}>
                      {profile.is_approved ? <UserCheck size={14} /> : <ShieldAlert size={14} />}
                      {profile.is_approved ? 'AUTHORIZED' : 'RESTRICTED'}
                    </span>
                  </td>
                  <td style={{ padding: '2rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => toggleRole(profile.id, profile.role)}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 1rem', fontSize: '0.65rem', letterSpacing: '0.1em' }}
                      >
                        {profile.role === 'super_admin' ? 'DEMOTE' : 'MAKE ADMIN'}
                      </button>

                      {profile.role !== 'super_admin' && (
                        <button 
                          onClick={() => toggleApproval(profile.id, profile.is_approved)}
                          className={profile.is_approved ? "btn-secondary" : "btn-primary"}
                          style={{ padding: '0.6rem 1.25rem', fontSize: '0.7rem' }}
                        >
                          {profile.is_approved ? 'REVOKE' : 'AUTHORIZE'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProfiles.length === 0 && (
            <div style={{ padding: '8rem', textAlign: 'center', color: 'rgba(26, 26, 26, 0.2)', fontSize: '1.2rem', fontWeight: 800 }}>
              ROSTER IS SILENT.
            </div>
          )}
        </div>
      </div>
      <style>{`
        .hover-row:hover { background: rgba(154, 0, 2, 0.01); }
      `}</style>
    </div>
  );
}
