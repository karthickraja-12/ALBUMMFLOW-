"use client";
import { useState, useEffect } from 'react';
import { User, Mail, Building, ShieldCheck, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setUser(data); // In our new schema, User and Profile are the same record
        }
      } catch (e) {
        console.error("Profile fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    getProfile();
  }, []);

  if (loading) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Loading Profile...</div>;
  if (!profile) return <div className="container flex-center" style={{ minHeight: '60vh' }}>Please sign in to view your profile.</div>;

  return (
    <div className="animate-fade" style={{ background: 'hsl(var(--background))', minHeight: '100vh', padding: '4rem 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--muted))', textDecoration: 'none', marginBottom: '2rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '3rem' }}>About Me</h1>

        <div className="glass" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
          {/* Accent Glow */}
          <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'hsla(var(--primary), 0.1)', filter: 'blur(80px)', borderRadius: '50%', zIndex: 0 }}></div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3.5rem', flexWrap: 'wrap' }}>
              <div className="flex-center" style={{ width: '100px', height: '100px', borderRadius: '30px', background: 'linear-gradient(135deg, hsl(var(--primary)), hsla(var(--primary), 0.7))', color: 'white', fontSize: '2.5rem', fontWeight: 800, boxShadow: '0 20px 40px -10px hsla(var(--primary), 0.4)' }}>
                {profile?.name ? profile.name[0].toUpperCase() : profile?.email?.[0].toUpperCase()}
              </div>
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{profile?.name || 'Photographer'}</h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span className="glass-pill" style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', fontSize: '0.8rem' }}>
                    {profile?.role === 'super_admin' ? 'Super Admin' : 'Pro Admin'}
                  </span>
                  {profile?.is_approved && (
                    <span className="glass-pill" style={{ background: 'hsla(var(--success), 0.1)', color: 'hsl(var(--success))', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldCheck size={14} /> Verified Account
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'hsla(var(--muted), 0.05)', color: 'hsl(var(--muted))', flexShrink: 0 }}>
                  <Mail size={20} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.4rem' }}>Email Address</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{profile.email}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'hsla(var(--muted), 0.05)', color: 'hsl(var(--muted))', flexShrink: 0 }}>
                  <Building size={20} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.4rem' }}>Studio Branding</label>
                  <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{profile?.company_name || 'Not Set'}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.25rem' }}>
                <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'hsla(var(--muted), 0.05)', color: 'hsl(var(--muted))', flexShrink: 0 }}>
                  <User size={20} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--muted))', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.4rem' }}>Account ID</label>
                  <p style={{ fontSize: '0.9rem', color: 'hsl(var(--muted))', fontFamily: 'monospace' }}>{profile.id.substring(0, 18)}...</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '4rem', borderTop: '1px solid hsl(var(--border))', paddingTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/dashboard/settings" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Settings size={18} /> Manage Account Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
