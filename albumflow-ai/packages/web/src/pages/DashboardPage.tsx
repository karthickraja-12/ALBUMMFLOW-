import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Images, Clock, CheckCircle2, Upload, BarChart3, HardDrive, Plus, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatDate, getStatusBadgeClass, getStatusLabel } from '@/lib/utils';

// ── Mock data for demo mode ──────────────────────────────────
const MOCK_STATS = {
  total_collections: 12,
  pending_collections: 4,
  completed_collections: 8,
  total_photos: 3_840,
  total_selected: 1_152,
  selection_rate: 30,
};

const MOCK_COLLECTIONS = [
  { id: '1', collection_name: 'Arun & Priya Wedding', client_name: 'Arun Kumar', event_type: 'Wedding', status: 'EXPORTED', total_photos: 540, selected_photos: 162, created_at: '2024-05-15', event_date: '2024-05-12' },
  { id: '2', collection_name: 'Meera Birthday Celebration', client_name: 'Meera Nair', event_type: 'Birthday', status: 'CLIENT_VIEWING', total_photos: 210, selected_photos: 0, created_at: '2024-05-20', event_date: '2024-05-18' },
  { id: '3', collection_name: 'Raj & Sunita Reception', client_name: 'Raj Patel', event_type: 'Reception', status: 'CONFIRMED', total_photos: 380, selected_photos: 115, created_at: '2024-05-22', event_date: '2024-05-20' },
  { id: '4', collection_name: 'Corporate Annual Meet', client_name: 'TechCorp Ltd', event_type: 'Corporate Event', status: 'AWAITING_CLIENT', total_photos: 290, selected_photos: 0, created_at: '2024-05-25', event_date: '2024-05-24' },
  { id: '5', collection_name: 'Deepa Engagement', client_name: 'Deepa Menon', event_type: 'Engagement', status: 'READY', total_photos: 175, selected_photos: 0, created_at: '2024-05-28', event_date: '2024-05-26' },
];

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <p className="stat-value">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics').then((r) => r.data),
    retry: false,
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['collections', { limit: 5 }],
    queryFn: () => api.get('/collections?limit=5').then((r) => r.data),
    retry: false,
  });

  // Fallback to mock data if API unavailable
  const stats = analyticsData?.stats ?? MOCK_STATS;
  const collections = collectionsData?.collections ?? MOCK_COLLECTIONS;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">{greeting}, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's an overview of your AlbumFlow workspace</p>
        </div>
        <Link to="/collections/new" className="btn-primary">
          <Plus size={16} />
          New Collection
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<Images size={18} className="text-blue-600" />} label="Total Collections" value={stats.total_collections} color="bg-blue-50" />
        <StatCard icon={<Clock size={18} className="text-amber-600" />} label="Pending Selections" value={stats.pending_collections} color="bg-amber-50" />
        <StatCard icon={<CheckCircle2 size={18} className="text-emerald-600" />} label="Completed" value={stats.completed_collections} color="bg-emerald-50" />
        <StatCard icon={<Upload size={18} className="text-indigo-600" />} label="Photos Uploaded" value={stats.total_photos} color="bg-indigo-50" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card p-5 flex items-center gap-4">
          <div className="stat-icon bg-teal-50">
            <BarChart3 size={18} className="text-teal-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.selection_rate}%</p>
            <p className="text-sm text-slate-500">Avg Selection Rate</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="stat-icon bg-purple-50">
            <HardDrive size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">{stats.total_selected.toLocaleString()}</p>
            <p className="text-sm text-slate-500">Photos Selected</p>
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Recent Collections</h2>
          <Link to="/collections" className="btn-ghost btn-sm">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-wrapper">
          <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr' }}>
            <span>Collection</span>
            <span>Client</span>
            <span>Status</span>
            <span>Photos</span>
            <span>Created</span>
          </div>

          {collections.map((c: any) => (
            <Link
              key={c.id}
              to={`/collections/${c.id}`}
              className="table-row block"
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', alignItems: 'center' }}
            >
              <span className="font-medium text-slate-900 text-sm truncate">{c.collection_name}</span>
              <span className="text-sm text-slate-600 truncate">{c.client_name}</span>
              <span>
                <span className={getStatusBadgeClass(c.status)}>{getStatusLabel(c.status)}</span>
              </span>
              <span className="text-sm text-slate-600">{c.total_photos}</span>
              <span className="text-sm text-slate-500">{formatDate(c.created_at)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
