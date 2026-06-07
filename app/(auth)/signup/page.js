"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('A connection error occurred. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

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
          <h2 className="auth-title" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#9A0002' }}>Join the Roster</h2>
          <div style={{ width: '40px', height: '3px', background: '#9A0002', margin: '1.5rem auto 0', opacity: 0.3 }}></div>
        </div>

        {error && (
          <div style={{ color: 'white', marginBottom: '2.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, background: '#9A0002', padding: '1.25rem', borderRadius: '1rem' }}>
            {error.toUpperCase()}
          </div>
        )}
        {success && (
          <div style={{ color: '#059669', marginBottom: '2.5rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, background: 'rgba(5, 150, 105, 0.1)', padding: '1.25rem', borderRadius: '1rem' }}>
            {success.toUpperCase()}
          </div>
        )}
        
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
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
          <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '1.5rem', fontSize: '0.9rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            {loading ? 'INITIALIZING...' : 'CREATE ATELIER'} {!loading && <Sparkles size={18} />}
          </button>
        </form>

        <div style={{ marginTop: '4rem', textAlign: 'center', borderTop: '1px solid rgba(154, 0, 2, 0.05)', paddingTop: '2.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'rgba(26, 26, 26, 0.5)', fontWeight: 600 }}>
            Already on the Roster? <Link href="/login" style={{ color: '#9A0002', fontWeight: 900, textDecoration: 'none' }}>SIGN IN</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
