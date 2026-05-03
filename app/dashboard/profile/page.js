"use client";
import { useState, useEffect } from 'react';
import { User, Mail, Building, ShieldCheck, Settings, ArrowLeft, Crown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch('/api/profile', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setUser(data); 
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, []);

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh', gap: '2rem', flexDirection: 'column', background: '#EFE6DE' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(154, 0, 2, 0.1)', borderTopColor: '#9A0002', borderRadius: '50%' }}></div>
      <span style={{ fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', fontSize: '0.75rem' }}>IDENTIFYING...</span>
    </div>
  );

  if (!profile) return (
    <div className="flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: '2rem', background: '#EFE6DE' }}>
       <h2 style={{ fontSize: '2rem', color: '#9A0002', fontWeight: 900 }}>Session Expired</h2>
       <Link href="/login" className="btn-primary">SIGN IN</Link>
    </div>
  );

  return (
    <div className="animate-fade" style={{ minHeight: '100vh', padding: '6rem 0', background: '#EFE6DE' }}>
      <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
        
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9A0002', textDecoration: 'none', marginBottom: '4rem', fontWeight: 900, fontSize: '0.75rem', letterSpacing: '0.2rem' }}>
          <ArrowLeft size={16} strokeWidth={3} /> RETURN TO CATALOG
        </Link>

        <h1 style={{ fontSize: 'clamp(3rem, 7vw, 5rem)', fontWeight: 900, marginBottom: '6rem', letterSpacing: '-0.04em', color: '#9A0002' }}>IDENTITY</h1>

        <div className="glass-alive animate-pop" style={{ padding: '5rem', background: 'white', borderRadius: '2rem', position: 'relative' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', marginBottom: '6rem', flexWrap: 'wrap' }}>
              <div className="flex-center" style={{ width: '120px', height: '120px', borderRadius: '2.5rem', background: '#9A0002', color: 'white', fontSize: '3rem', fontWeight: 900, boxShadow: '0 20px 40px rgba(154, 0, 2, 0.2)', overflow: 'hidden' }}>
                {profile?.image ? (
                  <img src={profile.image} alt="Studio Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1rem', background: 'white' }} />
                ) : (
                  profile?.name ? profile.name[0].toUpperCase() : profile?.email?.[0].toUpperCase()
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', letterSpacing: '-0.03em', color: '#1a1a1a', lineHeight: 1 }}>{profile?.name || 'Photographer'}</h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ padding: '0.5rem 1.25rem', background: 'rgba(154, 0, 2, 0.05)', color: '#9A0002', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.15em', borderRadius: '0.75rem' }}>
                    {profile?.role === 'super_admin' ? 'GRAND MASTER' : 'STUDIO PRO'}
                  </span>
                  {profile?.is_approved && (
                    <span style={{ padding: '0.5rem 1.25rem', background: '#9A0002', color: 'white', fontSize: '0.7rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem' }}>
                      <Crown size={14} fill="currentColor" /> VERIFIED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(26, 26, 26, 0.4)', textTransform: 'uppercase', letterSpacing: '0.2rem', fontWeight: 900, marginBottom: '1rem' }}>TRANSMISSION ADDRESS</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                   <Mail size={20} color="#9A0002" />
                   <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a1a' }}>{profile.email.toUpperCase()}</p>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'rgba(26, 26, 26, 0.4)', textTransform: 'uppercase', letterSpacing: '0.2rem', fontWeight: 900, marginBottom: '1rem' }}>STUDIO BRANDING</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                   <Building size={20} color="#9A0002" />
                   <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1a1a1a' }}>{profile?.company_name?.toUpperCase() || 'NOT CONFIGURED'}</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '6rem', borderTop: '1px solid rgba(154, 0, 2, 0.05)', paddingTop: '4rem' }}>
              <Link href="/dashboard/settings" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem' }}>
                <Settings size={20} /> ATELIER PREFERENCES
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
