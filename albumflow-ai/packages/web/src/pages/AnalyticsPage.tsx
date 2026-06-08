import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Images, CheckSquare, BarChart3 } from 'lucide-react';
import api from '@/lib/api';

const MOCK_MONTHLY = [
  { month: 'Jan', count: 2 }, { month: 'Feb', count: 4 },
  { month: 'Mar', count: 7 }, { month: 'Apr', count: 5 },
  { month: 'May', count: 11 }, { month: 'Jun', count: 8 },
];

const MOCK_STATS = {
  total_collections: 12,
  total_photos: 3840,
  total_selected: 1152,
  selection_rate: 30,
};

const MOCK_ACTIVITY = [
  { action: 'EXPORT_COMPLETED', description: '162 photos exported to Google Drive — Arun & Priya Wedding', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { action: 'CLIENT_CONFIRMED', description: 'Client confirmed 115 photos — Raj & Sunita Reception', created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { action: 'PHOTOS_UPLOADED', description: 'Upload finalized — Deepa Engagement (175 photos)', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { action: 'COLLECTION_CREATED', description: 'Collection "Krishna Baby Shower" created for Lakshmi Krishna', created_at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
  { action: 'COLLECTION_CREATED', description: 'Collection "Corporate Annual Meet" created for TechCorp Ltd', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
];

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics').then((r) => r.data),
    retry: false,
  });

  const stats = data?.stats ?? MOCK_STATS;
  const monthly = data?.monthly_data?.length ? data.monthly_data : MOCK_MONTHLY;
  const activity = data?.recent_activity?.length ? data.recent_activity : MOCK_ACTIVITY;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Track your photography workflow performance</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: <Images size={18} className="text-blue-600" />, label: 'Total Collections', value: stats.total_collections, color: 'bg-blue-50' },
          { icon: <TrendingUp size={18} className="text-indigo-600" />, label: 'Photos Uploaded', value: stats.total_photos, color: 'bg-indigo-50' },
          { icon: <CheckSquare size={18} className="text-emerald-600" />, label: 'Photos Selected', value: stats.total_selected, color: 'bg-emerald-50' },
          { icon: <BarChart3 size={18} className="text-amber-600" />, label: 'Selection Rate', value: `${stats.selection_rate}%`, color: 'bg-amber-50' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}>{icon}</div>
            <p className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="section-title">Monthly Collections</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="count" fill="#0F172A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="section-title">Growth Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }} />
              <Line type="monotone" dataKey="count" stroke="#0F172A" strokeWidth={2} dot={{ fill: '#0F172A', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {activity.map((a: any, i: number) => (
            <div key={i} className="px-6 py-3 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-navy-700 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-700">{a.description || a.action}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(a.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
