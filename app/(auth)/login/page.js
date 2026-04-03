"use client";
import { useState } from 'react';
import { Camera } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isWelcoming, setIsWelcoming] = useState(false);
  const [userName, setUserName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
           setError(error.message);
    } else {
           // Extract name from metadata or use email prefix as fallback
           const name = data.user.user_metadata?.full_name || email.split('@')[0];
           setUserName(name);
           setIsWelcoming(true);
           
           // Premium delay to show the greeting
           setTimeout(() => {
             window.location.href = '/dashboard';
           }, 2500);
    }
  };

  if (isWelcoming) {
    return (
      <div className="container flex-center animate-fade" style={{ minHeight: '80vh' }}>
        <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid hsla(var(--primary), 0.3)' }}>
          <div className="animate-pop" style={{ fontSize: '1.5rem', color: 'hsl(var(--primary))', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
            <Camera size={48} strokeWidth={2.5} />
          </div>
          <h2 className="animate-pop" style={{ fontSize: '2.5rem', marginBottom: '1rem', animationDelay: '0.1s' }}>
            Welcome back, <span className="text-gradient" style={{ display: 'block' }}>{userName}</span>
          </h2>
          <p className="animate-pop" style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontStyle: 'italic', animationDelay: '0.3s', lineHeight: '1.6' }}>
            "The camera is an instrument that teaches people how to see without a camera."
          </p>
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
            <div className="loading-dot" style={{ animationDelay: '0s' }}></div>
            <div className="loading-dot" style={{ animationDelay: '0.1s' }}></div>
            <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex-center animate-fade" style={{ minHeight: '90vh' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '4rem 3.5rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="text-signature" style={{ fontSize: '1.25rem', letterSpacing: '0.4em', marginBottom: '1.5rem' }}>ALBUMFLOW</div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Welcome Back</h2>
          <p style={{ color: 'rgba(0,0,0,0.3)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', marginTop: '0.5rem' }}>AUTHENTICATE TO ACCESS YOUR ATELIER</p>
        </div>

        {error && <div style={{ color: 'hsl(var(--danger))', marginBottom: '2rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.15em' }}>EMAIL ADDRESS</label>
            <input 
              type="email" 
              required 
              className="input-focus"
              style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--background)', color: 'black', fontSize: '1rem', fontWeight: 600 }}
              value={email} onChange={e => setEmail(e.target.value)} 
              placeholder="studio@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '1rem', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', letterSpacing: '0.15em' }}>PASSWORD</label>
            <input 
              type="password" 
              required 
              className="input-focus"
              style={{ width: '100%', padding: '1.25rem', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--background)', color: 'black', fontSize: '1rem', fontWeight: 600 }}
              value={password} onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn-primary" style={{ padding: '1.5rem', fontSize: '1rem', marginTop: '1rem' }}>ENTER ATELIER</button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>
            Don't have an account? <Link href="/signup" style={{ color: 'black', fontWeight: 900, textDecoration: 'none', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>SIGN UP</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
