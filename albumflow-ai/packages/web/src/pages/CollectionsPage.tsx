import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Images, Upload, Copy, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, getStatusBadgeClass, getStatusLabel, copyToClipboard } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'UPLOADING', label: 'Uploading' },
  { value: 'READY', label: 'Ready' },
  { value: 'AWAITING_CLIENT', label: 'Awaiting Client' },
  { value: 'CLIENT_VIEWING', label: 'Client Viewing' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'EXPORTED', label: 'Exported' },
];

const MOCK_COLLECTIONS = [
  { id: '1', collection_name: 'Arun & Priya Wedding', client_name: 'Arun Kumar', event_type: 'Wedding', status: 'EXPORTED', total_photos: 540, selected_photos: 162, created_at: '2024-05-15', event_date: '2024-05-12', client_access_token: 'demo-tok-1' },
  { id: '2', collection_name: 'Meera Birthday Celebration', client_name: 'Meera Nair', event_type: 'Birthday', status: 'CLIENT_VIEWING', total_photos: 210, selected_photos: 0, created_at: '2024-05-20', event_date: '2024-05-18', client_access_token: 'demo-tok-2' },
  { id: '3', collection_name: 'Raj & Sunita Reception', client_name: 'Raj Patel', event_type: 'Reception', status: 'CONFIRMED', total_photos: 380, selected_photos: 115, created_at: '2024-05-22', event_date: '2024-05-20', client_access_token: 'demo-tok-3' },
  { id: '4', collection_name: 'Corporate Annual Meet', client_name: 'TechCorp Ltd', event_type: 'Corporate Event', status: 'AWAITING_CLIENT', total_photos: 290, selected_photos: 0, created_at: '2024-05-25', event_date: '2024-05-24', client_access_token: 'demo-tok-4' },
  { id: '5', collection_name: 'Deepa Engagement', client_name: 'Deepa Menon', event_type: 'Engagement', status: 'READY', total_photos: 175, selected_photos: 0, created_at: '2024-05-28', event_date: '2024-05-26', client_access_token: 'demo-tok-5' },
  { id: '6', collection_name: 'Suresh Anniversary Shoot', client_name: 'Suresh Iyer', event_type: 'Anniversary', status: 'AWAITING_CLIENT', total_photos: 320, selected_photos: 0, created_at: '2024-06-01', event_date: '2024-05-30', client_access_token: 'demo-tok-6' },
  { id: '7', collection_name: 'Krishna Baby Shower', client_name: 'Lakshmi Krishna', event_type: 'Baby Shower', status: 'UPLOADING', total_photos: 98, selected_photos: 0, created_at: '2024-06-05', event_date: '2024-06-04', client_access_token: 'demo-tok-7' },
];

export default function CollectionsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['collections', { search, status }],
    queryFn: () => api.get(`/collections?search=${search}&status=${status}`).then((r) => r.data),
    retry: false,
  });

  // Use mock data as fallback
  let collections = data?.collections ?? MOCK_COLLECTIONS;

  // Client-side filter for demo mode
  if (!data) {
    if (search) collections = collections.filter((c: any) =>
      c.collection_name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_name.toLowerCase().includes(search.toLowerCase())
    );
    if (status) collections = collections.filter((c: any) => c.status === status);
  }

  async function handleCopyLink(id: string, token: string) {
    const link = `${window.location.origin}/gallery/${token}`;
    await copyToClipboard(link);
    setCopiedId(id);
    toast.success('Gallery link copied!');
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">{collections.length} total collections</p>
        </div>
        <Link to="/collections/new" className="btn-primary">
          <Plus size={16} /> New Collection
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search collections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-44">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-header" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr 1.2fr' }}>
          <span>Collection</span>
          <span>Client</span>
          <span>Status</span>
          <span>Photos</span>
          <span>Selected</span>
          <span>Actions</span>
        </div>

        {collections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Images size={24} className="text-slate-400" /></div>
            <p className="text-sm font-medium text-slate-700">No collections match your filters</p>
          </div>
        ) : (
          collections.map((c: any) => (
            <div
              key={c.id}
              className="table-row"
              style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 0.8fr 1.2fr' }}
            >
              <div className="min-w-0">
                <Link to={`/collections/${c.id}`} className="font-medium text-slate-900 text-sm hover:text-navy-700 truncate block">
                  {c.collection_name}
                </Link>
                <p className="text-xs text-slate-400 mt-0.5">{c.event_type} · {formatDate(c.event_date)}</p>
              </div>
              <span className="text-sm text-slate-600 self-center truncate">{c.client_name}</span>
              <span className="self-center">
                <span className={getStatusBadgeClass(c.status)}>{getStatusLabel(c.status)}</span>
              </span>
              <span className="text-sm text-slate-700 self-center font-medium">{c.total_photos}</span>
              <span className="text-sm text-slate-700 self-center font-medium">{c.selected_photos}</span>
              <div className="flex items-center gap-1.5 self-center">
                <Link to={`/collections/${c.id}/upload`} className="btn-ghost btn-sm px-2" title="Upload photos">
                  <Upload size={14} />
                </Link>
                <button
                  onClick={() => handleCopyLink(c.id, c.client_access_token)}
                  className="btn-ghost btn-sm px-2"
                  title="Copy gallery link"
                >
                  {copiedId === c.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
                <button className="btn-ghost btn-sm px-2 text-red-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
