"use client";
import { useState } from 'react';
import { Camera, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isWelcoming, setIsWelcoming] = useState(false);
  const [userName, setUserName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });
    
    if (result?.error) {
      setError("Invalid credentials. Please try again.");
    } else {
      const name = email.split('@')[0];
      setUserName(name);
      setIsWelcoming(true);
      
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2500);
    }
  };

  if (isWelcoming) {
    return (
      <div className="container flex-center animate-fade" style={{ minHeight: '100vh', background: '#EFE6DE' }}>
        <div className="glass-alive" style={{ width: '100%', maxWidth: '500px', padding: '5rem 3rem', textAlign: 'center', borderColor: 'rgba(154, 0, 2, 0.2)' }}>
          <div className="animate-pop" style={{ color: '#9A0002', marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
            <Sparkles size={64} />
          </div>
          <h2 className="animate-pop" style={{ fontSize: '3rem', marginBottom: '1.5rem', fontWeight: 900, color: '#9A0002', letterSpacing: '-0.03em' }}>
            Welcome, <br />
            <span style={{ fontStyle: 'italic', fontWeight: 300 }}>{userName.toUpperCase()}</span>
          </h2>
          <p className="animate-pop" style={{ color: 'rgba(26, 26, 26, 0.5)', fontSize: '1.1rem', fontWeight: 500, lineHeight: '1.8' }}>
            Preparing your studio archive...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-center animate-fade" style={{ minHeight: '100vh', background: '#EFE6DE', padding: '2rem' }}>
      <style>{`
        @media (max-width: 480px) {
          .auth-card { padding: 3.5rem 2rem !important; border-radius: 1.5rem !important; }
          .auth-title { font-size: 2rem !important; }
        }
      `}</style>
      <div className="glass-alive auth-card" style={{ width: '100%', maxWidth: '460px', padding: '5rem 4rem', borderRadius: '2rem', background: 'white' }}>
        <div style={{ textAlign: 'center', marginBottom: '4.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
            <img 
              src="/logo.png" 
              alt="iColors Logo" 
              style={{ 
                height: '42px', 
                width: 'auto', 
                mixBlendMode: 'multiply',
                borderRadius: '10px',
                filter: 'brightness(1.4) contrast(1.2)'
              }} 
            />
          </div>
          <h2 className="auth-title" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#9A0002' }}>Studio Access</h2>
          <div style={{ width: '40px', height: '3px', background: '#9A0002', margin: '1.5rem auto 0', opacity: 0.3 }}></div>
        </div>

        {error && (
          <div style={{ color: 'white', marginBottom: '2.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, background: '#9A0002', padding: '1.25rem', borderRadius: '1rem', letterSpacing: '0.05em' }}>
            {error.toUpperCase()}
          </div>
        )}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 900, color: 'rgba(26, 26, 26, 0.6)', letterSpacing: '0.2em' }}>IDENTITY</label>
            <input 
              type="email" 
              required 
              className="input-focus"
              style={{ width: '100%', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(154, 0, 2, 0.1)', background: '#F9F7F5', color: '#1a1a1a', fontSize: '1rem', fontWeight: 600 }}
              value={email} onChange={e => setEmail(e.target.value)} 
              placeholder="studio@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.75rem', fontWeight: 900, color: 'rgba(26, 26, 26, 0.6)', letterSpacing: '0.2em' }}>SECURED KEY</label>
            <input 
              type="password" 
              required 
              className="input-focus"
              style={{ width: '100%', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(154, 0, 2, 0.1)', background: '#F9F7F5', color: '#1a1a1a', fontSize: '1rem', fontWeight: 600 }}
              value={password} onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '1.5rem', fontSize: '0.9rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            ENTER ATELIER <ChevronRight size={18} />
          </button>
        </form>


        <div style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid rgba(154, 0, 2, 0.05)', paddingTop: '2.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'rgba(26, 26, 26, 0.5)', fontWeight: 600 }}>
            New to the Roster? <Link href="/signup" style={{ color: '#9A0002', fontWeight: 900, textDecoration: 'none' }}>GET ACCESS</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
