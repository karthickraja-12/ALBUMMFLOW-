"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, Shield, Search, User } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error) setProfiles(data);
    setLoading(false);
  };

  const toggleApproval = async (userId, currentStatus) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', userId);
    
    if (!error) fetchProfiles();
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="container flex-center" style={{ minHeight: '50vh' }}>Loading System State...</div>;

  return (
    <div className="animate-fade" style={{ background: 'var(--background)', minHeight: '100vh', padding: '6rem 0' }}>
      <div className="container">
        
        {/* Editorial System Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6rem' }}>
          <div>
            <div style={{ letterSpacing: '0.4em', color: 'rgba(0,0,0,0.3)', fontWeight: 900, fontSize: '0.7rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>SYSTEM ARCHIVE</div>
            <h1 className="text-signature" style={{ fontSize: '4.5rem', marginBottom: '1rem', letterSpacing: '-0.04em' }}>SYSTEM CONTROL</h1>
            <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: '1.2rem', fontWeight: 600 }}>Curation of the creative roster and platform access.</p>
          </div>
          <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 2rem', gap: '1.5rem', width: '380px', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '1.5rem' }}>
            <Search size={20} color="rgba(0,0,0,0.2)" />
            <input 
              type="text" placeholder="Search the Roster..." 
              style={{ border: 'none', background: 'transparent', color: 'black', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: 600 }}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Editorial Data Table */}
        <div className="glass" style={{ overflow: 'hidden', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '2.5rem', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>PHOTOGRAPHER</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>STUDIO ATELIER</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>ACCESS ROLE</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>STATUS</th>
                <th style={{ padding: '2rem', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', transition: 'background 0.4s' }} className="hover-row">
                  <td style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', color: 'black' }}>
                        <User size={20} strokeWidth={2.5} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>{profile.full_name || 'Anonymous'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '2rem', color: 'rgba(0,0,0,0.5)', fontWeight: 700 }}>{profile.company_name}</td>
                  <td style={{ padding: '2rem' }}>
                    <span className="glass" style={{ padding: '0.5rem 1.25rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 900, background: profile.role === 'super_admin' ? 'black' : 'rgba(0,0,0,0.05)', color: profile.role === 'super_admin' ? 'white' : 'black', letterSpacing: '0.1em' }}>
                      {profile.role === 'super_admin' ? 'SUPER ADMIN' : 'ARTISAN'}
                    </span>
                  </td>
                  <td style={{ padding: '2rem' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: profile.is_approved ? 'black' : 'rgba(0,0,0,0.2)', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
                      {profile.is_approved ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                      {profile.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '2rem', textAlign: 'right' }}>
                    {profile.role !== 'super_admin' && (
                      <button 
                        onClick={() => toggleApproval(profile.id, profile.is_approved)}
                        className={profile.is_approved ? "btn-secondary" : "btn-primary"}
                        style={{ padding: '0.75rem 1.75rem', fontSize: '0.8rem' }}
                      >
                        {profile.is_approved ? 'REVOKE ACCESS' : 'GRANT ACCESS'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProfiles.length === 0 && (
            <div style={{ padding: '8rem', textAlign: 'center', color: 'rgba(0,0,0,0.2)', fontSize: '1.1rem', fontWeight: 600 }}>
              No artisans found in the roster.
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .hover-row:hover { background: rgba(0,0,0,0.01); }
      `}</style>
    </div>
  );
}
