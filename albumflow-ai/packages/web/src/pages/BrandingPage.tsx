import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Loader2, Eye, Image } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

const MOCK_BRANDING = {
  logo_url: null,
  watermark_type: 'TEXT',
  watermark_text: 'Dream Frames Studio',
  watermark_position: 'BOTTOM_RIGHT',
  watermark_opacity: 30,
  show_phone: true,
  show_website: true,
};

const WATERMARK_TYPES = ['TEXT', 'LOGO', 'COMBINED'];
const WATERMARK_POSITIONS = ['TOP_LEFT', 'TOP_RIGHT', 'CENTER', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'];
const OPACITY_OPTIONS = [10, 20, 30, 40, 50];

function positionLabel(p: string) {
  return p.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ');
}

export default function BrandingPage() {
  const queryClient = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: () => api.get('/branding').then((r) => r.data.branding),
    retry: false,
  });

  const brandingData = data ?? MOCK_BRANDING;

  const [form, setForm] = useState({
    watermark_type: MOCK_BRANDING.watermark_type,
    watermark_position: MOCK_BRANDING.watermark_position,
    watermark_opacity: MOCK_BRANDING.watermark_opacity,
    show_phone: MOCK_BRANDING.show_phone,
    show_website: MOCK_BRANDING.show_website,
    watermark_text: MOCK_BRANDING.watermark_text,
    logo_url: '',
  });

  // Sync server data into form
  if (data && form.watermark_text === MOCK_BRANDING.watermark_text && data.watermark_text && data.watermark_text !== MOCK_BRANDING.watermark_text) {
    setForm((prev) => ({ ...prev, ...data }));
  }

  const saveMutation = useMutation({
    mutationFn: (updates: any) => api.put('/branding', updates),
    onSuccess: () => {
      toast.success('Branding settings saved!');
      queryClient.invalidateQueries({ queryKey: ['branding'] });
    },
    onError: () => toast.error('Failed to save settings'),
  });

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be under 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    saveMutation.mutate({ ...form, logo_url: logoPreview || form.logo_url });
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Studio Branding</h1>
        <p className="page-subtitle">Configure how your studio appears on client galleries and watermarks</p>
      </div>

      <div className="space-y-6">
        {/* Studio Logo */}
        <div className="card p-6">
          <h2 className="section-title">Studio Logo</h2>
          <div className="flex items-start gap-6">
            <div
              onClick={() => logoRef.current?.click()}
              className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-slate-300 hover:bg-slate-50 transition-all overflow-hidden"
            >
              {logoPreview || data?.logo_url ? (
                <img src={logoPreview || data?.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <Image size={20} className="text-slate-300 mx-auto mb-1" />
                  <p className="text-[10px] text-slate-400">Upload logo</p>
                </div>
              )}
            </div>
            <input ref={logoRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={handleLogoChange} />
            <div>
              <button onClick={() => logoRef.current?.click()} className="btn-secondary btn-sm mb-2">
                <Upload size={14} /> Choose Logo
              </button>
              <p className="text-xs text-slate-400">PNG, JPG, or SVG · Max 5MB</p>
            </div>
          </div>
        </div>

        {/* Watermark Settings */}
        <div className="card p-6">
          <h2 className="section-title">Watermark Settings</h2>
          <div className="space-y-5">
            {/* Type */}
            <div>
              <label className="label">Watermark Type</label>
              <div className="flex gap-2">
                {WATERMARK_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm((f) => ({ ...f, watermark_type: t }))}
                    className={`btn btn-sm ${form.watermark_type === t ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {t[0] + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Text */}
            {(form.watermark_type === 'TEXT' || form.watermark_type === 'COMBINED') && (
              <div className="form-group">
                <label className="label">Watermark Text</label>
                <input
                  value={form.watermark_text}
                  onChange={(e) => setForm((f) => ({ ...f, watermark_text: e.target.value }))}
                  className="input"
                  placeholder="Dream Frames Studio"
                />
              </div>
            )}

            {/* Position */}
            <div>
              <label className="label">Position</label>
              <div className="grid grid-cols-5 gap-1.5">
                {WATERMARK_POSITIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setForm((f) => ({ ...f, watermark_position: p }))}
                    className={`btn btn-sm text-[11px] ${form.watermark_position === p ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {positionLabel(p)}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="label">Opacity</label>
              <div className="flex gap-2">
                {OPACITY_OPTIONS.map((o) => (
                  <button
                    key={o}
                    onClick={() => setForm((f) => ({ ...f, watermark_opacity: o }))}
                    className={`btn btn-sm ${form.watermark_opacity === o ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {o}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Display Options */}
        <div className="card p-6">
          <h2 className="section-title">Gallery Display</h2>
          <div className="space-y-3">
            {[
              { key: 'show_phone', label: 'Show phone number on gallery' },
              { key: 'show_website', label: 'Show website link on gallery' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="w-4 h-4 rounded accent-navy-700"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Watermark Preview */}
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2">
            <Eye size={16} className="text-slate-400" /> Live Preview
          </h2>
          <div className="relative bg-slate-200 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
            <p className="text-slate-400 text-sm">Sample Photo</p>
            <div
              className="absolute text-white/60 font-bold text-sm pointer-events-none select-none"
              style={{
                opacity: form.watermark_opacity / 100,
                ...(form.watermark_position === 'CENTER' && { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }),
                ...(form.watermark_position === 'TOP_LEFT' && { top: 12, left: 12 }),
                ...(form.watermark_position === 'TOP_RIGHT' && { top: 12, right: 12 }),
                ...(form.watermark_position === 'BOTTOM_LEFT' && { bottom: 12, left: 12 }),
                ...(form.watermark_position === 'BOTTOM_RIGHT' && { bottom: 12, right: 12 }),
              }}
            >
              {form.watermark_type !== 'LOGO' ? form.watermark_text || 'Your Studio Name' : ''}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saveMutation.isPending} className="btn-primary">
            {saveMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {saveMutation.isPending ? 'Saving…' : 'Save Branding Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
