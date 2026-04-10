"use client";
import Link from 'next/link';
import { Camera, LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // 1. RE-DEFINING VISIBILITY: User wants branding "IN EVERY PAGE"
  const isGallery = pathname?.includes('/gallery');
  
  // Custom styling per page type if needed
  const isHome = pathname === '/';
  
  const navStyle = {
    position: isHome ? 'fixed' : 'sticky', 
    top: 0, 
    zIndex: 100, 
    width: '100%',
    padding: '1.25rem 3rem',
    background: isHome ? 'rgba(239, 230, 222, 0.8)' : 'white',
    backdropFilter: isHome ? 'blur(10px)' : 'none',
    borderBottom: '1px solid rgba(154, 0, 2, 0.1)',
    boxShadow: isHome ? 'none' : '0 4px 15px rgba(0,0,0,0.02)'
  };

  if (isGallery) return null;

  return (
    <nav style={navStyle}>
      <div className="container nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0 }}>
        {/* Left Section: Logo & Desktop Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', color: '#9A0002', fontWeight: 900, fontSize: '1rem', letterSpacing: '0.4em', flexShrink: 0 }}>
            ALBUMFLOW
          </Link>
          
          <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            {user && (
              <>
                <div style={{ width: '1px', height: '16px', background: 'rgba(154, 0, 2, 0.2)' }}></div>
                <Link href="/dashboard" style={{ textDecoration: 'none', color: pathname === '/dashboard' ? '#9A0002' : 'rgba(26,26,26,0.4)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                  CATALOG
                </Link>
                <Link href="/dashboard/settings" style={{ textDecoration: 'none', color: pathname.includes('settings') ? '#9A0002' : 'rgba(26,26,26,0.4)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                  BRANDING
                </Link>
                {user.role === 'super_admin' && (
                  <Link href="/admin" style={{ textDecoration: 'none', color: pathname.startsWith('/admin') ? '#9A0002' : 'rgba(26,26,26,0.4)', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>
                    ADMIN
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Right Section: Desktop Auth & Mobile Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Desktop Only Auth */}
          <div className="nav-links-desktop" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                <Link href="/dashboard/profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
                  {user.image && (
                    <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '0.4rem', background: 'white', overflow: 'hidden', border: '1px solid rgba(154, 0, 2, 0.1)' }}>
                      <img src={user.image} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.2rem' }} />
                    </div>
                  )}
                  <div style={{ textAlign: 'left' }}>
                     <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#9A0002' }}>{user.company_name?.toUpperCase() || user.name?.toUpperCase()}</div>
                  </div>
                </Link>
                <button 
                  onClick={handleLogout} 
                  style={{ background: 'rgba(154,0,2,0.05)', color: '#9A0002', border: 'none', padding: '0.6rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}
                >
                  SIGN OUT
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <Link href="/login" style={{ textDecoration: 'none', color: '#9A0002', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.1em' }}>SIGN IN</Link>
                <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none', padding: '0.75rem 2rem', fontSize: '0.75rem' }}>GET ACCESS</Link>
              </div>
            )}
          </div>

          {/* Mobile Only Toggle */}
          <button className="nav-menu-button" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle Menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Drawer Overlay */}
        <div className={`nav-mobile-drawer ${!isMenuOpen ? 'closed' : ''}`}>
          {user ? (
            <>
              <Link href="/dashboard" style={{ textDecoration: 'none', color: '#9A0002', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.2em' }}>CATALOG</Link>
              <Link href="/dashboard/settings" style={{ textDecoration: 'none', color: '#9A0002', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.2em' }}>BRANDING</Link>
              {user.role === 'super_admin' && (
                <Link href="/admin" style={{ textDecoration: 'none', color: '#9A0002', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.2em' }}>ADMIN</Link>
              )}
              <Link href="/dashboard/profile" style={{ textDecoration: 'none', color: '#9A0002', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.2em' }}>MY STUDIO</Link>
              <div style={{ height: '1px', background: 'rgba(154, 0, 2, 0.1)', margin: '1rem 0' }}></div>
              <button onClick={handleLogout} style={{ background: '#9A0002', color: 'white', border: 'none', padding: '1.25rem', borderRadius: '1rem', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer' }}>SIGN OUT</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ textDecoration: 'none', color: '#9A0002', fontWeight: 900, fontSize: '0.9rem', letterSpacing: '0.2em' }}>SIGN IN</Link>
              <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none', textAlign: 'center', padding: '1.25rem', borderRadius: '1rem' }}>GET ACCESS</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
