"use client";
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import imageCompression from 'browser-image-compression';
import { Settings, Image as ImageIcon, Globe, Lock, ExternalLink, Mail, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';

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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        setFormData({
          company_name: data.company_name || '',
          logo_url: data.logo_url || '',
          brand_color: data.brand_color || '221 83% 53%'
        });
      }
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      // 1. Compress logo (small icon)
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 512, useWebWorker: true };
      const compressed = await imageCompression(file, options);

      // 2. Upload to storage
      const { data: { user } } = await supabase.auth.getUser();
      const path = `branding/${user.id}-logo.png`;
      
      const { error: uploadError } = await supabase.storage
        .from('albumflow')
        .upload(path, compressed, { upsert: true });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('albumflow')
        .getPublicUrl(path);

      // 4. Temporarily update local state (saves to DB on final save)
      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      alert("Logo uploaded! Don't forget to click 'Save' below.");
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
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', user.id);
    
    if (!error) alert("Branding updated successfully!");
    setSaving(false);
    // Refresh to update Navbar
    window.location.reload();
  };

  const connectGoogle = () => {
    window.location.href = '/api/auth/google';
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '50vh' }}>Loading Settings...</div>;

  return (
    <div className="animate-fade" style={{ background: 'var(--background)', minHeight: '100vh', padding: '6rem 0' }}>
      <div className="container" style={{ maxWidth: '1000px' }}>
        
        {/* Editorial Brand Header */}
        <div style={{ marginBottom: '6rem' }}>
          <div style={{ letterSpacing: '0.4em', color: 'rgba(0,0,0,0.3)', fontWeight: 900, fontSize: '0.7rem', marginBottom: '1.5rem', textTransform: 'uppercase' }}>STUDIO MANAGEMENT</div>
          <h1 className="text-signature" style={{ fontSize: '4.5rem', marginBottom: '1rem', letterSpacing: '-0.04em' }}>BRAND ATELIER</h1>
          <p style={{ color: 'rgba(0,0,0,0.4)', fontSize: '1.2rem', fontWeight: 600 }}>Refining your studio's digital identity and archival orchestration.</p>
        </div>

        {syncStatus === 'success' && (
          <div className="glass animate-pop" style={{ border: '1px solid #059669', background: 'rgba(5, 150, 105, 0.05)', color: '#059669', padding: '1.5rem 2rem', borderRadius: '1.5rem', marginBottom: '4rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <CheckCircle size={24} />
            <span style={{ fontWeight: 800, letterSpacing: '0.02em' }}>GOOGLE DRIVE CONNECTED SUCCESSFULLY</span>
          </div>
        )}

        {errorStatus && (
          <div className="glass animate-pop" style={{ border: '1px solid hsl(var(--danger))', background: 'rgba(239, 68, 68, 0.05)', color: 'hsl(var(--danger))', padding: '1.5rem 2rem', borderRadius: '1.5rem', marginBottom: '4rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <AlertCircle size={24} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontWeight: 800, letterSpacing: '0.02em' }}>
                {errorStatus === 'missing_token' ? 'CONNECTION REFRESH REQUIRED' : `CONNECTION ERROR: ${errorStatus.toUpperCase()}`}
              </span>
              {errorStatus === 'missing_token' && (
                <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'rgba(239, 68, 68, 0.7)' }}>
                  Your secure vault link needs to be refreshed. Please click "Reconnect Archive" below.
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {/* Identity Section - Boutique Surface */}
          <div className="glass animate-pop" style={{ padding: '5rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '3rem', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '5rem' }}>
              <div className="flex-center" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', color: 'black' }}>
                <Globe size={24} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '2rem', letterSpacing: '-0.03em', fontWeight: 800 }}>Studio Identity</h3>
            </div>

            <div style={{ display: 'grid', gap: '4rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', marginBottom: '1.5rem', letterSpacing: '0.2em' }}>OFFICIAL STUDIO NAME</label>
                <input 
                  type="text" 
                  className="input-focus"
                  style={{ width: '100%', padding: '1.5rem', borderRadius: '1.25rem', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--background)', color: 'black', fontSize: '1.1rem', fontWeight: 600 }}
                  value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})}
                  placeholder="e.g. Raja Wedding Cinema"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 900, color: 'rgba(0,0,0,0.3)', marginBottom: '2.5rem', letterSpacing: '0.2em' }}>SIGNATURE LOGO (MAXIMIZED PREVIEW)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5rem', flexWrap: 'wrap' }}>
                  <div style={{ width: '220px', height: '220px', borderRadius: '2.5rem', border: '1px solid rgba(0,0,0,0.05)', background: 'rgba(0,0,0,0.02)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.02)' }}>
                    {formData.logo_url ? (
                      <img src={formData.logo_url} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={60} style={{ color: 'rgba(0,0,0,0.1)' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <label className="btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '1rem', padding: '1.25rem 2.5rem', fontSize: '0.9rem' }}>
                      {uploadingLogo ? (
                         <>
                           <Loader2 size={20} className="animate-spin" />
                           SYNCHRONIZING...
                         </>
                      ) : (
                        <>
                          <Camera size={20} strokeWidth={3} />
                          {formData.logo_url ? 'UPDATE SIGNATURE' : 'UPLOAD SIGNATURE'}
                        </>
                      )}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} disabled={uploadingLogo} />
                    </label>
                    <p style={{ marginTop: '2.5rem', fontSize: '0.95rem', color: 'rgba(0,0,0,0.4)', lineHeight: 1.8, fontWeight: 500 }}>
                      Elevate your galleries with a high-resolution signature. We recommend a clean SVG or PNG with transparent background for the highest fidelity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Section - Boutique Surface */}
          <div className="glass animate-pop" style={{ padding: '5rem', background: 'white', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '3rem', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.04)', animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '4rem' }}>
              <div className="flex-center" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(234, 67, 53, 0.08)', color: '#EA4335' }}>
                <Mail size={24} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: '2rem', letterSpacing: '-0.03em', fontWeight: 800 }}>Archival Sync</h3>
            </div>
            
            <p style={{ color: 'rgba(0,0,0,0.5)', marginBottom: '4rem', fontSize: '1.15rem', lineHeight: '1.8', fontWeight: 500 }}>
              The Archive Core automatically mirrors every client selection to your studio's Google Drive. Maintain absolute control over your digital assets.
            </p>

            <div style={{ padding: '3rem', background: 'var(--background)', borderRadius: '2rem', border: '1px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  {profile?.google_refresh_token ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'black' }}>
                      <CheckCircle size={24} strokeWidth={3} />
                      <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.8rem' }}>SYNC ENGINE: ONLINE</span>
                    </div>
                  ) : (
                    <span style={{ color: 'rgba(0,0,0,0.2)', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>VAULT CONNECTION REQUIRED</span>
                  )}
                </div>
                
                <button 
                  type="button" 
                  onClick={connectGoogle}
                  className="btn-secondary"
                  style={{ padding: '1rem 2.5rem', fontSize: '0.85rem' }}
                >
                  {profile?.google_refresh_token ? 'REFRESH VAULT LINK' : 'CONNECT ARCHIVE'}
                </button>
              </div>

              {profile?.google_refresh_token && (
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '2.5rem', marginTop: '2.5rem', fontSize: '0.95rem', color: 'rgba(0,0,0,0.3)', lineHeight: 1.8, fontWeight: 500 }}>
                  Your studio vault is securely linked with high-frequency synchronization. We recommend re-authenticating every 90 days to ensure peak transmission security.
                </div>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary" 
            style={{ padding: '1.75rem', justifyContent: 'center', fontSize: '1.1rem', borderRadius: '2rem' }}
          >
            {saving ? 'COMMITTING BRAND...' : 'COMMIT BRANDING CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PhotographerSettings() {
  return (
    <Suspense fallback={<div className="container flex-center" style={{ minHeight: '100vh' }}>Loading Boutique Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
