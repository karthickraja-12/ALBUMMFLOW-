import Link from 'next/link';
import { Camera, Zap, Users, Shield, Sparkles, Globe } from 'lucide-react';

export default function HomePage() {
  return (
    <div style={{ background: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Cinematic Navigation Overlay */}
      <nav style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '2.5rem', zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="text-signature" style={{ fontSize: '1.5rem', letterSpacing: '0.4em' }}>ALBUMFLOW</div>
          <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
            <Link href="/login" style={{ fontSize: '0.8rem', fontWeight: 800, textDecoration: 'none', color: 'rgba(0,0,0,0.4)', letterSpacing: '0.15em' }}>LOGIN</Link>
            <Link href="/signup" className="btn-primary" style={{ textDecoration: 'none' }}>GET ACCESS</Link>
          </div>
        </div>
      </nav>

      {/* Immersive Editorial Hero */}
      <section style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'relative',
        textAlign: 'center',
        padding: '0 2rem',
        background: 'radial-gradient(circle at center, hsla(35, 40%, 95%, 1) 0%, var(--background) 100%)'
      }}>
        <div className="animate-cinematic" style={{ maxWidth: '1100px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1.5rem', color: 'rgba(0,0,0,0.3)', letterSpacing: '0.6em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 900, marginBottom: '2.5rem' }}>
            <div style={{ width: '40px', height: '1px', background: 'black', opacity: 0.1 }}></div>
            FOR THE ARTISTIC STUDIO
            <div style={{ width: '40px', height: '1px', background: 'black', opacity: 0.1 }}></div>
          </div>
          
          <h1 style={{ fontSize: 'clamp(3rem, 9vw, 7.5rem)', marginBottom: '2.5rem', maxWidth: '1000px', margin: '0 auto 3rem', lineHeight: 0.95 }}>
            THE EDITORIAL <br />
            <span style={{ opacity: 0.3, fontStyle: 'italic', fontWeight: 400 }}>ATELIER</span>
          </h1>
          
          <p style={{ fontSize: '1.35rem', color: 'rgba(0,0,0,0.5)', maxWidth: '650px', margin: '0 auto 4.5rem', lineHeight: 1.8, fontWeight: 500, letterSpacing: '-0.01em' }}>
            Bespoke client galleries, automated archival synchronization, and a minimalist canvas for your studio identity. Pure creative freedom.
          </p>
          
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
            <Link href="/signup" className="btn-primary" style={{ padding: '1.25rem 3.5rem' }}>START YOUR STUDIO</Link>
            <Link href="/login" className="btn-secondary" style={{ padding: '1.25rem 3.5rem' }}>MEMBER LOGIN</Link>
          </div>
        </div>

        {/* Cinematic Backdrop Accent */}
        <div style={{ 
          position: 'absolute', 
          bottom: '5%', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '70vw', 
          height: '20vh', 
          background: 'linear-gradient(to top, hsla(35, 40%, 90%, 0.3) 0%, transparent 100%)',
          borderRadius: '100% 100% 0 0',
          filter: 'blur(60px)',
          zIndex: 0
        }}></div>
      </section>

      {/* Boutique Features Grid */}
      <section className="container" style={{ padding: '12rem 0' }}>
         <div style={{ textAlign: 'center', marginBottom: '10rem' }}>
            <h2 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', letterSpacing: '-0.04em' }}>CURATED FOR VISUAL STORYTEILLERS</h2>
            <p style={{ opacity: 0.4, fontSize: '1.1rem', fontWeight: 500, letterSpacing: '0.1em' }}>PRECISION TOOLS FOR THE ELITE PHOTOGRAPHER</p>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '4rem' }}>
            <div className="glass animate-pop" style={{ padding: '4.5rem 3.5rem', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white' }}>
               <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '1.25rem', background: 'var(--accent)', color: 'var(--primary)' }}>
                  <Sparkles size={28} />
               </div>
               <div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Artisan Galleries</h3>
                  <p style={{ color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, fontSize: '1.1rem' }}>Bespoke, high-contrast galleries that elevate your studio branding. No noise, just your vision perfectly framed.</p>
               </div>
            </div>

            <div className="glass animate-pop" style={{ padding: '4.5rem 3.5rem', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white', animationDelay: '0.2s' }}>
               <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '1.25rem', background: 'var(--accent)', color: 'var(--primary)' }}>
                  <Zap size={28} />
               </div>
               <div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Editorial Sync</h3>
                  <p style={{ color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, fontSize: '1.1rem' }}>Direct Google Drive archival automation. Your final selections are preserved in high-fidelity, automatically.</p>
               </div>
            </div>

            <div className="glass animate-pop" style={{ padding: '4.5rem 3.5rem', height: '420px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'white', animationDelay: '0.4s' }}>
               <div className="flex-center" style={{ width: '64px', height: '64px', borderRadius: '1.25rem', background: 'var(--accent)', color: 'var(--primary)' }}>
                  <Shield size={28} />
               </div>
               <div>
                  <h3 style={{ fontSize: '2rem', marginBottom: '1.25rem' }}>Studio Security</h3>
                  <p style={{ color: 'rgba(0,0,0,0.5)', lineHeight: 1.7, fontSize: '1.1rem' }}>Vault-grade RLS protection and ultra-fast media serving. Reliable, scalable, and built for professional volume.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Closing Call to Action */}
      <section style={{ padding: '18rem 0', textAlign: 'center', background: 'white', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
         <div className="container">
            <h2 style={{ fontSize: '5rem', marginBottom: '4rem', lineHeight: 0.9 }}>ELEVATE YOUR <br /> <span style={{ opacity: 0.2 }}>DELIVERY.</span></h2>
            <Link href="/signup" className="btn-primary" style={{ padding: '1.5rem 5rem', fontSize: '1.2rem' }}>JOIN THE ROSTER</Link>
         </div>
      </section>

      {/* Signature Footer */}
      <footer style={{ padding: '12rem 0', textAlign: 'center', opacity: 0.8 }}>
          <div className="text-signature" style={{ letterSpacing: '1.2em', fontSize: '1.1rem', fontWeight: 900 }}>ALBUMFLOW ATELIER</div>
          <p style={{ fontSize: '0.8rem', marginTop: '4rem', fontWeight: 800, color: 'rgba(0,0,0,0.2)', letterSpacing: '0.3em' }}>© 2026 THE ARCHIVAL ROSTER. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}
