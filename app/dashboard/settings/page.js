"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import imageCompression from 'browser-image-compression';
import { Settings, Image as ImageIcon, Globe, Lock, ExternalLink, Mail, CheckCircle, AlertCircle, Camera, Loader2, Zap, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';

function SettingsContent() {
  const searchParams = useSearchParams();
  const syncStatus = searchParams.get('sync');
  const errorStatus = searchParams.get('error');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    logo_url: '',
    brand_color: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          company_name: data.company_name || '',
          logo_url: data.image || '', 
          brand_color: data.brand_color || '221 83% 53%'
        });
      }
    } catch (err) {
      console.error("Fetch profile failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 512, useWebWorker: true };
      const compressed = await imageCompression(file, options);

      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `logo-${Date.now()}.png`,
          contentType: file.type,
          eventId: 'branding'
        })
      });
      const { uploadUrl, publicUrl } = await presignedRes.json();

      const uploadSuccess = await fetch(uploadUrl, {
        method: 'PUT',
        body: compressed,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadSuccess.ok) throw new Error("AWS Logo Upload Failed");

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      alert("Logo uploaded! Don't forget to click 'Commit' below.");
    } catch (err) {
      console.error(err);
      alert("Logo upload failed: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) alert("Branding updated successfully!");
      else {
        const err = await res.json();
        throw new Error(err.message || "Update failed");
      }
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
      window.location.reload();
    }
  };

  const connectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh', gap: '2rem', flexDirection: 'column', background: '#EFE6DE' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(154, 0, 2, 0.1)', borderTopColor: '#9A0002', borderRadius: '50%' }}></div>
      <span style={{ fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', fontSize: '0.75rem' }}>INITIALIZING ATELIER...</span>
    </div>
  );

  return (
    <div className="animate-fade" style={{ minHeight: '100vh', padding: '6rem 0', background: '#EFE6DE' }}>
      <div className="container" style={{ maxWidth: '1000px', position: 'relative', zIndex: 1 }}>
        
        {/* Editorial Brand Header */}
        <div style={{ marginBottom: '8rem' }}>
          <div style={{ letterSpacing: '0.4em', color: '#9A0002', fontWeight: 900, fontSize: '0.75rem', marginBottom: '2.5rem', textTransform: 'uppercase', opacity: 0.6 }}>STUDIO MANAGEMENT</div>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', marginBottom: '1.5rem', letterSpacing: '-0.04em', fontWeight: 900, color: '#9A0002', lineHeight: 0.9 }}>BRAND ATELIER</h1>
          <p style={{ color: 'rgba(26, 26, 26, 0.5)', fontSize: '1.2rem', fontWeight: 600, maxWidth: '500px' }}>Refining your studio's digital identity and archival orchestration with absolute precision.</p>
        </div>

        {syncStatus === 'success' && (
          <div className="glass-alive animate-pop" style={{ background: '#9A0002', color: 'white', padding: '1.25rem 2.5rem', borderRadius: '1rem', marginBottom: '4rem', display: 'flex', alignItems: 'center', gap: '1.25rem', border: 'none' }}>
            <CheckCircle size={20} />
            <span style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.8rem' }}>GOOGLE VAULT SYNC: ONLINE</span>
          </div>
        )}

        {errorStatus && (
          <div className="glass-alive animate-pop" style={{ background: 'white', border: '1px solid #9A0002', color: '#9A0002', padding: '1.5rem 2.5rem', borderRadius: '1rem', marginBottom: '4rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <AlertCircle size={24} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontWeight: 900, letterSpacing: '0.1em' }}>
                {errorStatus === 'missing_token' ? 'CONNECTION REFRESH REQUIRED' : `CONNECTION ERROR: ${errorStatus.toUpperCase()}`}
              </span>
              {errorStatus === 'missing_token' && (
                <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.6 }}>
                  Your secure vault link needs to be refreshed. Please click "Reconnect Archive" below.
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {/* Identity Section */}
          <div className="glass-alive animate-pop" style={{ padding: '4rem', background: 'white', borderRadius: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
               <Globe size={24} color="#9A0002" />
               <h3 style={{ fontSize: '2rem', color: '#9A0002', fontWeight: 900 }}>Studio Identity</h3>
            </div>

            <div style={{ display: 'grid', gap: '4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'rgba(26, 26, 26, 0.4)', marginBottom: '1.25rem', letterSpacing: '0.2em' }}>OFFICIAL ATELIER NAME</label>
                <input 
                  type="text" 
                  className="input-focus"
                  style={{ width: '100%', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(154, 0, 2, 0.1)', background: '#F9F7F5', color: '#1a1a1a', fontSize: '1.1rem', fontWeight: 600 }}
                  value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})}
                  placeholder="e.g. Raja Wedding Cinema"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, color: 'rgba(26, 26, 26, 0.4)', marginBottom: '2.5rem', letterSpacing: '0.2em' }}>SIGNATURE LOGO</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '220px', height: '220px', borderRadius: '2rem', background: '#F9F7F5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', border: '1px solid rgba(154, 0, 2, 0.05)' }}>
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={48} color="rgba(154, 0, 2, 0.1)" />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '1rem' }}>
                      {uploadingLogo ? (
                         <>
                           <Loader2 size={20} className="animate-spin" />
                           SYNCING...
                         </>
                      ) : (
                        <>
                           <Camera size={20} />
                           {formData.logo_url ? 'UPDATE SIGNATURE' : 'UPLOAD SIGNATURE'}
                         </>
                      )}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </label>
                    <p style={{ marginTop: '2.5rem', fontSize: '1rem', color: 'rgba(26, 26, 26, 0.4)', lineHeight: 1.6, fontWeight: 500 }}>
                      Elevate your galleries with a high-resolution signature. We recommend a clean SVG or PNG with transparent background.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-alive animate-pop" style={{ padding: '4rem', background: 'white', borderRadius: '2rem', animationDelay: '0.1s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
               <Zap size={24} color="#9A0002" fill="currentColor" />
               <h3 style={{ fontSize: '2rem', color: '#9A0002', fontWeight: 900 }}>Archival Sync</h3>
            </div>
            
            <p style={{ color: 'rgba(26, 26, 26, 0.5)', marginBottom: '4rem', fontSize: '1.1rem', lineHeight: '1.7', fontWeight: 600 }}>
              The Archive Core automatically mirrors every client selection to your studio's Google Drive. Maintain absolute control over your digital assets.
            </p>

            <div style={{ padding: '2.5rem', background: '#F9F7F5', borderRadius: '1.5rem', border: '1px solid rgba(154, 0, 2, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {profile?.google_refresh_token ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9A0002' }}>
                      <ShieldCheck size={20} />
                      <span style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.8rem' }}>VAULT SYNC: ACTIVE</span>
                    </div>
                  ) : (
                    <span style={{ color: 'rgba(26, 26, 26, 0.3)', fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em' }}>VAULT CONNECTION REQUIRED</span>
                  )}
                </div>
                
                <button 
                  type="button" 
                  onClick={connectGoogle}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <ExternalLink size={18} />
                  {profile?.google_refresh_token ? 'REFRESH VAULT LINK' : 'CONNECT ARCHIVE'}
                </button>
              </div>

              {profile?.google_refresh_token && (
                <div style={{ borderTop: '1px solid rgba(154, 0, 2, 0.05)', paddingTop: '2rem', marginTop: '2rem', fontSize: '0.9rem', color: 'rgba(26, 26, 26, 0.4)', lineHeight: 1.6, fontWeight: 500 }}>
                  Your studio vault is securely linked with high-frequency synchronization. We recommend re-authenticating every 90 days.
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary" 
            style={{ padding: '1.75rem', justifyContent: 'center', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
          >
            {saving ? <><Loader2 size={24} className="animate-spin" /> COMMITTING...</> : <><CheckCircle size={24} strokeWidth={3} /> COMMIT BRANDING CHANGES</>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PhotographerSettings() {
  return (
    <Suspense fallback={
      <div className="flex-center" style={{ minHeight: '100vh', gap: '2rem', flexDirection: 'column', background: '#EFE6DE' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '3px solid rgba(154, 0, 2, 0.1)', borderTopColor: '#9A0002', borderRadius: '50%' }}></div>
        <span style={{ fontWeight: 900, letterSpacing: '0.4em', color: '#9A0002', fontSize: '0.75rem' }}>ACCESSING ATELIER...</span>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
