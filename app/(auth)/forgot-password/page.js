"use client";
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setMessage(`Error: ${error.message}`);
    else setMessage('Password reset link sent to your email.');
  };

  return (
    <div className="container flex-center animate-fade" style={{ minHeight: '80vh' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>Reset Password</h2>
        {message && <div style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
        <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input 
              type="email" placeholder="Your Email" required 
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--foreground)' }}
              value={email} onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <button type="submit" className="btn-primary">Send Reset Link</button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
