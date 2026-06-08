import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, RefreshCw, HardDrive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function GoogleDrivePage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['drive-status'],
    queryFn: () => api.get('/drive/status').then((r) => r.data.drive),
    retry: false,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get('/drive/connect');
      if (res.data.mock) {
        // Mock: directly call callback
        await api.get(`/drive/callback?code=mock&state=mock`);
        return;
      }
      window.location.href = res.data.auth_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-status'] });
      toast.success('Google Drive connected!');
    },
    onError: () => toast.error('Failed to connect Google Drive'),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.post('/drive/disconnect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drive-status'] });
      toast.success('Google Drive disconnected');
    },
  });

  const isConnected = data?.is_connected;

  return (
    <div className="animate-fade-in max-w-lg">
      <div className="page-header">
        <h1 className="page-title">Google Drive</h1>
        <p className="page-subtitle">Connect your Google Drive to automatically export selected photos</p>
      </div>

      {isLoading ? (
        <div className="card p-8 flex justify-center">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Status Card */}
          <div className="card p-6">
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isConnected ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                <HardDrive size={22} className={isConnected ? 'text-emerald-600' : 'text-slate-400'} />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Google Drive</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isConnected ? (
                    <><CheckCircle2 size={13} className="text-emerald-600" /><span className="text-xs text-emerald-700 font-medium">Connected</span></>
                  ) : (
                    <><XCircle size={13} className="text-slate-400" /><span className="text-xs text-slate-500">Not connected</span></>
                  )}
                </div>
              </div>
            </div>

            {isConnected && (
              <div className="space-y-2 mb-5 p-3 bg-slate-50 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Connected Account</span>
                  <span className="text-xs font-medium text-slate-700">{data.google_email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-500">Last Sync</span>
                  <span className="text-xs font-medium text-slate-700">{formatDate(data.last_sync)}</span>
                </div>
              </div>
            )}

            {isConnected ? (
              <div className="flex gap-3">
                <button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectMutation.isPending}
                  className="btn-secondary btn-sm"
                >
                  <RefreshCw size={14} />
                  Reconnect
                </button>
                <button
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                  className="btn-danger btn-sm"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="btn-primary"
              >
                {connectMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Connect Google Drive
              </button>
            )}
          </div>

          {/* How it works */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">How it works</h3>
            <ol className="space-y-2.5">
              {[
                'Client confirms their photo selection',
                'AlbumFlow creates a folder in your Drive',
                'Selected originals are transferred automatically',
                'You receive a notification when export is complete',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-navy-700 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-600">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
