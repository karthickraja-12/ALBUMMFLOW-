"use client";
import Link from 'next/link';
import { Camera } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // 1. SILENCE THE NAVBAR FOR GUESTS & LANDING PAGE (Move after hooks)
  const isGallery = pathname.startsWith('/gallery');
  const isHome = pathname === '/';
  if (isGallery || isHome) return null;

  return (
    <nav className="glass" style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 100, 
      borderRadius: 0, 
      borderTop: 'none', 
      borderLeft: 'none', 
      borderRight: 'none', 
      padding: '1.5rem 4rem',
      background: 'white',
      backdropFilter: 'blur(40px) saturate(200%)',
      borderBottom: '1px solid rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          {profile?.logo_url ? (
             <img src={profile.logo_url} alt={profile.company_name} style={{ height: '120px', maxWidth: '400px', objectFit: 'contain' }} />
          ) : (
            <div className="text-signature" style={{ letterSpacing: '0.4em', fontWeight: 900, fontSize: '1.8rem' }}>ALBUMFLOW</div>
          )}
        </Link>
        
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/dashboard" style={{ textDecoration: 'none', color: 'rgba(0,0,0,0.4)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.15em', transition: 'color 0.3s' }}>COLLECTIONS</Link>
              <Link href="/dashboard/settings" style={{ textDecoration: 'none', color: 'rgba(0,0,0,0.4)', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.15em' }}>BRANDING</Link>
              {profile?.role === 'super_admin' && (
                <Link href="/admin" style={{ textDecoration: 'none', color: 'black', fontWeight: 900, fontSize: '0.7rem' }}>ADMIN</Link>
              )}
              <button 
                onClick={handleLogout} 
                className="btn-primary"
                style={{ padding: '0.5rem 1.75rem', fontSize: '0.65rem' }}
              >
                SIGN OUT
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ textDecoration: 'none', color: 'rgba(0,0,0,0.6)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>LOGIN</Link>
              <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1.75rem', fontSize: '0.75rem' }}>GET ACCESS</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
