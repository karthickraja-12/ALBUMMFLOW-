import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Key, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatDate } from '@/lib/utils';

const licenseSchema = z.object({
  license_key: z.string().min(5, 'Enter a valid license key'),
});

export default function AccountPage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'license'>('profile');

  const { data: licenseData } = useQuery({
    queryKey: ['license'],
    queryFn: () => api.get('/license/info').then((r) => r.data),
    retry: false,
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(licenseSchema),
  });

  async function onValidateLicense(data: { license_key: string }) {
    try {
      const res = await api.post('/license/validate', data);
      toast.success(`License activated! Plan: ${res.data.plan}`);
      updateUser({ plan: res.data.plan, license_status: res.data.status });
      queryClient.invalidateQueries({ queryKey: ['license'] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid license key');
    }
  }

  const license = licenseData?.license;
  const licenseStatus = licenseData?.license_status || user?.license_status;
  const plan = licenseData?.plan || user?.plan;

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="page-header">
        <h1 className="page-title">Account</h1>
        <p className="page-subtitle">Manage your profile and license</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-btn mb-6 w-fit">
        {(['profile', 'license'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-[10px] text-sm font-medium transition-all duration-150 ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-subtle' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-navy-700 text-white text-xl font-bold flex items-center justify-center">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-slate-900">{user?.full_name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Full Name', value: user?.full_name },
              { label: 'Email', value: user?.email },
              { label: 'Studio', value: user?.studio_name || '—' },
              { label: 'Phone', value: user?.phone || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                <span className="text-sm text-slate-500">{label}</span>
                <span className="text-sm font-medium text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'license' && (
        <div className="space-y-4">
          {/* Current License */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-navy-700/10 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-navy-700" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Current License</p>
                <p className="text-xs text-slate-500">Your current plan and status</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Plan', value: plan?.toLowerCase() || '—' },
                { label: 'Status', value: licenseStatus?.toLowerCase() || '—' },
                { label: 'License Key', value: licenseData?.license_key || '—' },
                { label: 'Activated', value: license?.start_date ? formatDate(license.start_date) : '—' },
                { label: 'Expires', value: license?.expiry_date ? formatDate(license.expiry_date) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="text-sm font-medium text-slate-800 capitalize">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Activate License */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <Key size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Activate License</p>
                <p className="text-xs text-slate-500">Enter your license key to activate or upgrade</p>
              </div>
            </div>
            <form onSubmit={handleSubmit(onValidateLicense as any)} className="space-y-3">
              <div className="form-group">
                <label className="label">License Key</label>
                <input
                  {...register('license_key')}
                  className={`input font-mono ${errors.license_key ? 'input-error' : ''}`}
                  placeholder="AF-XXXX-XXXX-XXXX"
                />
                {errors.license_key && (
                  <p className="text-xs text-red-500 mt-1">{errors.license_key.message as string}</p>
                )}
              </div>
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                {isSubmitting ? 'Validating…' : 'Activate License'}
              </button>
            </form>
            <p className="text-xs text-slate-400 mt-3 text-center">
              License keys start with <code className="font-mono text-slate-500">AF-</code>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
