"use client";
import { Camera, Clock } from 'lucide-react';
import Link from 'next/link';

export default function PendingApproval() {
  return (
    <div className="container flex-center animate-fade" style={{ minHeight: '80vh' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '500px', padding: '4rem 2rem', textAlign: 'center', border: '1px solid hsla(var(--primary), 0.3)' }}>
        <div className="flex-center" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', margin: '0 auto 2.5rem' }}>
          <Clock size={40} />
        </div>
        
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Account <span className="text-gradient">Under Review</span></h2>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2.5rem' }}>
          Welcome to AlbumFlow AI! To maintain a premium network of photographers, all new accounts are manually reviewed by our Super Admin.
        </p>

        <div className="glass" style={{ padding: '1.5rem', background: 'hsla(var(--primary), 0.05)', marginBottom: '2.5rem', textAlign: 'left' }}>
          <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>What's Next?</p>
          <ul style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingLeft: '1.25rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>Our team will verify your subscription/payment.</li>
            <li>You will receive an email once your access is granted.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/" className="btn-secondary">Back Home</Link>
          <a href="mailto:support@albumflow.ai" className="btn-primary" style={{ padding: '0.875rem 1.5rem' }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}
