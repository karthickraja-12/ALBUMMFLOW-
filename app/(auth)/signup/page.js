"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div className="container flex-center animate-fade" style={{ minHeight: '90vh' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '4rem 3.5rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="text-signature" style={{ fontSize: '1.25rem', letterSpacing: '0.4em', marginBottom: '1.5rem' }}>ALBUMFLOW</div>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Join the Atelier</h2>
          <p style={{ color: 'rgba(0,0,0,0.3)', fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', marginTop: '0.5rem' }}>COMMENCE YOUR CURATION JOURNEY</p>
        </div>

        {error && <div style={{ color: 'hsl(var(--danger))', marginBottom: '2rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
        {success && <div style={{ color: 'hsl(var(--primary))', marginBottom: '2rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>{success}</div>}
        
        <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
          <button type="submit" className="btn-primary" style={{ padding: '1.5rem', fontSize: '1rem', marginTop: '1rem' }}>CREATE ATELIER</button>
        </form>

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>
            Already have an account? <Link href="/login" style={{ color: 'black', fontWeight: 900, textDecoration: 'none', borderBottom: '2px solid rgba(0,0,0,0.1)' }}>SIGN IN</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
