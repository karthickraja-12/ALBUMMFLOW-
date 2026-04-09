import Link from 'next/link';
import { Camera, Zap, Users, Shield, Sparkles, Globe, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ color: 'var(--foreground)', minHeight: '100vh', overflowX: 'hidden', background: '#EFE6DE' }}>
      <style>{`
        @media (max-width: 768px) {
          .nav-container { padding: 1rem 1.5rem !important; }
          .hero-section { padding: 6rem 1.5rem 4rem !important; }
          .hero-buttons { flex-direction: column !important; width: 100% !important; gap: 1rem !important; }
          .hero-buttons a { width: 100% !important; text-align: center; }
          .features-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; padding: 0 1rem !important; }
          .cta-title { font-size: 2.5rem !important; line-height: 1.1 !important; }
          .landing-footer { flex-direction: column !important; text-align: center !important; }
        }
      `}</style>
      

      {/* Clean Editorial Hero */}
      <section className="hero-section" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        textAlign: 'center',
        padding: '0 2rem',
        position: 'relative'
      }}>
        <div className="animate-pop" style={{ maxWidth: '900px', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', color: '#9A0002', letterSpacing: '0.4em', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 900, marginBottom: '2rem', opacity: 0.8 }}>
            STUDIO ARCHIVAL SYSTEMS
          </div>
          
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', color: '#9A0002', marginBottom: '2.5rem', lineHeight: 0.95, fontWeight: 900, letterSpacing: '-0.03em' }}>
            ELEVATE YOUR <br />
            <span style={{ fontStyle: 'italic', fontWeight: 300 }}>CRAFT DELIVERY</span>
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: 'rgba(26, 26, 26, 0.7)', maxWidth: '600px', margin: '0 auto 4rem', lineHeight: 1.7, fontWeight: 500 }}>
            Precision client galleries and automated archival synchronization. A sophisticated canvas for the modern photography studio.
          </p>
          
          <div className="hero-buttons" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" className="btn-primary">START YOUR STUDIO</Link>
            <Link href="/login" className="btn-secondary">MEMBER ACCESS</Link>
          </div>
        </div>

        {/* Subtle Decorative Accent */}
        <div style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', opacity: 0.05, fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1em', color: '#9A0002' }}>
          PHOTOGRAPHY ARCHIVE V.1.0
        </div>
      </section>

      {/* Structured Features Grid */}
      <section style={{ padding: '10rem 0', background: 'rgba(154, 0, 2, 0.02)' }}>
        <div className="container">
          <div className="animate-fade" style={{ marginBottom: '8rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#9A0002', marginBottom: '1.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>ENGINEERED FOR ELITE STUDIOS</h2>
            <div style={{ width: '60px', height: '4px', background: '#9A0002', margin: '0 auto' }}></div>
          </div>

          <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
            <div className="glass-alive" style={{ padding: '4rem 3rem', borderRadius: '1.5rem', border: '1px solid rgba(154, 0, 2, 0.1)' }}>
              <Sparkles size={32} color="#9A0002" style={{ marginBottom: '2.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', color: '#9A0002', marginBottom: '1.25rem', fontWeight: 800 }}>Bespoke Galleries</h3>
              <p style={{ color: 'rgba(26, 26, 26, 0.6)', lineHeight: 1.7, fontSize: '1.05rem' }}>High-contrast, distraction-free delivery. Frame your vision with the respect it deserves.</p>
            </div>

            <div className="glass-alive" style={{ padding: '4rem 3rem', borderRadius: '1.5rem', border: '1px solid rgba(154, 0, 2, 0.1)' }}>
              <Zap size={32} color="#9A0002" style={{ marginBottom: '2.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', color: '#9A0002', marginBottom: '1.25rem', fontWeight: 800 }}>Studio Vault Sync</h3>
              <p style={{ color: 'rgba(26, 26, 26, 0.6)', lineHeight: 1.7, fontSize: '1.05rem' }}>Direct archival automation to your Google Drive. High-fidelity preservation, simplified.</p>
            </div>

            <div className="glass-alive" style={{ padding: '4rem 3rem', borderRadius: '1.5rem', border: '1px solid rgba(154, 0, 2, 0.1)' }}>
              <Shield size={32} color="#9A0002" style={{ marginBottom: '2.5rem' }} />
              <h3 style={{ fontSize: '1.75rem', color: '#9A0002', marginBottom: '1.25rem', fontWeight: 800 }}>Encrypted Archival</h3>
              <p style={{ color: 'rgba(26, 26, 26, 0.6)', lineHeight: 1.7, fontSize: '1.05rem' }}>Military-grade RLS protection for your client assets. Built for professional volume and trust.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial CTA */}
      <section style={{ padding: '12rem 0', textAlign: 'center' }}>
        <div className="container">
          <h2 className="cta-title" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: '#9A0002', marginBottom: '4rem', fontWeight: 900, lineHeight: 0.9 }}>READY TO ELEVATE?</h2>
          <Link href="/signup" className="btn-primary" style={{ padding: '1.5rem 5rem', fontSize: '1rem' }}>JOIN THE ROSTER <ArrowRight size={20} style={{ marginLeft: '1rem', display: 'inline' }} /></Link>
        </div>
      </section>

      {/* Professional Footer */}
      <footer style={{ padding: '6rem 0', borderTop: '1px solid rgba(154, 0, 2, 0.1)', background: 'white' }}>
        <div className="container landing-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ fontSize: '1rem', letterSpacing: '0.4em', fontWeight: 900, color: '#9A0002' }}>ALBUMFLOW</div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(26, 26, 26, 0.4)', letterSpacing: '0.1em' }}>© 2026 THE ARCHIVAL ROSTER. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
