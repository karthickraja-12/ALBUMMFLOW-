import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Upload, ExternalLink, Images, Calendar,
  Loader2, Send
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDate, getStatusBadgeClass, getStatusLabel, copyToClipboard } from '@/lib/utils';

// Mock photos for demo
function makeMockPhotos(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${i + 1}`,
    original_filename: `IMG_${String(i + 1).padStart(4, '0')}.jpg`,
    s3_preview_key: null,
    preview_url: null,
    upload_status: 'READY',
    width: 4000,
    height: 3000,
    is_selected: i % 3 === 0,
  }));
}

const MOCK_COLLECTIONS: Record<string, any> = {
  '1': { id: '1', collection_name: 'Arun & Priya Wedding', client_name: 'Arun Kumar', event_type: 'Wedding', status: 'EXPORTED', total_photos: 540, selected_photos: 162, created_at: '2024-05-15', event_date: '2024-05-12', client_access_token: 'demo-tok-1', upload_completed: true, photos: makeMockPhotos(48), photo_selections: [] },
  '2': { id: '2', collection_name: 'Meera Birthday Celebration', client_name: 'Meera Nair', event_type: 'Birthday', status: 'CLIENT_VIEWING', total_photos: 210, selected_photos: 0, created_at: '2024-05-20', event_date: '2024-05-18', client_access_token: 'demo-tok-2', upload_completed: true, photos: makeMockPhotos(36), photo_selections: [] },
  '3': { id: '3', collection_name: 'Raj & Sunita Reception', client_name: 'Raj Patel', event_type: 'Reception', status: 'CONFIRMED', total_photos: 380, selected_photos: 115, created_at: '2024-05-22', event_date: '2024-05-20', client_access_token: 'demo-tok-3', upload_completed: true, photos: makeMockPhotos(36), photo_selections: [] },
  '4': { id: '4', collection_name: 'Corporate Annual Meet', client_name: 'TechCorp Ltd', event_type: 'Corporate Event', status: 'AWAITING_CLIENT', total_photos: 290, selected_photos: 0, created_at: '2024-05-25', event_date: '2024-05-24', client_access_token: 'demo-tok-4', upload_completed: true, photos: makeMockPhotos(24), photo_selections: [] },
  '5': { id: '5', collection_name: 'Deepa Engagement', client_name: 'Deepa Menon', event_type: 'Engagement', status: 'READY', total_photos: 175, selected_photos: 0, created_at: '2024-05-28', event_date: '2024-05-26', client_access_token: 'demo-tok-5', upload_completed: true, photos: makeMockPhotos(30), photo_selections: [] },
  '6': { id: '6', collection_name: 'Suresh Anniversary Shoot', client_name: 'Suresh Iyer', event_type: 'Anniversary', status: 'AWAITING_CLIENT', total_photos: 320, selected_photos: 0, created_at: '2024-06-01', event_date: '2024-05-30', client_access_token: 'demo-tok-6', upload_completed: true, photos: makeMockPhotos(32), photo_selections: [] },
  '7': { id: '7', collection_name: 'Krishna Baby Shower', client_name: 'Lakshmi Krishna', event_type: 'Baby Shower', status: 'UPLOADING', total_photos: 98, selected_photos: 0, created_at: '2024-06-05', event_date: '2024-06-04', client_access_token: 'demo-tok-7', upload_completed: false, photos: makeMockPhotos(18), photo_selections: [] },
};

// Palette of placeholder colors for photo grid in demo
const COLORS = [
  'bg-slate-200', 'bg-blue-100', 'bg-amber-100', 'bg-rose-100',
  'bg-emerald-100', 'bg-purple-100', 'bg-indigo-100', 'bg-teal-100',
];

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => api.get(`/collections/${id}`).then((r) => r.data),
    retry: false,
  });

  const exportMutation = useMutation({
    mutationFn: () => api.post(`/drive/export/${id}`),
    onSuccess: () => {
      toast.success('Export to Google Drive started!');
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
    },
    onError: () => toast.error('Connect Google Drive first to export'),
  });

  const setReadyMutation = useMutation({
    mutationFn: () => api.patch(`/collections/${id}`, { status: 'AWAITING_CLIENT' }),
    onSuccess: () => {
      toast.success('Client link is now active — share it with your client!');
      queryClient.invalidateQueries({ queryKey: ['collection', id] });
    },
    onError: () => toast.info('Demo mode: status update simulated'),
  });

  async function handleCopyLink() {
    const token = collection?.client_access_token || `demo-tok-${id}`;
    const link = `${window.location.origin}/gallery/${token}`;
    await copyToClipboard(link);
    setCopied(true);
    toast.success('Gallery link copied!');
    setTimeout(() => setCopied(false), 2500);
  }

  // Use real API data or mock fallback
  const collection = data?.collection ?? (id ? MOCK_COLLECTIONS[id] : null);

  if (!collection) {
    return (
      <div className="animate-fade-in">
        <Link to="/collections" className="btn-ghost btn-sm mb-4 -ml-2 inline-flex">
          <ArrowLeft size={16} /> Collections
        </Link>
        <p className="text-slate-500">Collection not found.</p>
      </div>
    );
  }

  const galleryUrl = `/gallery/${collection.client_access_token}`;
  const isConfirmed = ['CONFIRMED', 'EXPORTED'].includes(collection.status);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <Link to="/collections" className="btn-ghost btn-sm mb-4 -ml-2 inline-flex">
          <ArrowLeft size={16} /> Collections
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title">{collection.collection_name}</h1>
              <span className={getStatusBadgeClass(collection.status)}>
                {getStatusLabel(collection.status)}
              </span>
            </div>
            <p className="page-subtitle">{collection.client_name} · {collection.event_type}</p>
          </div>
          <div className="flex gap-2">
            {!isConfirmed && (
              <>
                <Link to={`/collections/${id}/upload`} className="btn-secondary">
                  <Upload size={16} /> Upload More
                </Link>
                {collection.status === 'READY' && (
                  <button onClick={() => setReadyMutation.mutate()} className="btn-secondary">
                    <Send size={16} /> Share with Client
                  </button>
                )}
              </>
            )}
            {collection.status === 'CONFIRMED' && (
              <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} className="btn-primary">
                {exportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                Export to Google Drive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2"><Images size={14} /> Total Photos</div>
          <p className="text-2xl font-bold text-slate-900">{collection.total_photos}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2"><Check size={14} /> Selected</div>
          <p className="text-2xl font-bold text-slate-900">{collection.selected_photos}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2"><Calendar size={14} /> Event Date</div>
          <p className="text-lg font-bold text-slate-900">{formatDate(collection.event_date)}</p>
        </div>
      </div>

      {/* Gallery link */}
      <div className="card p-5 mb-6">
        <p className="text-sm font-semibold text-slate-700 mb-3">Client Gallery Link</p>
        <div className="flex gap-2">
          <div className="flex-1 input text-xs text-slate-500 truncate bg-slate-50 cursor-default">
            {window.location.origin}{galleryUrl}
          </div>
          <button onClick={handleCopyLink} className="btn-secondary btn-sm px-3">
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <a href={galleryUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm px-3">
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Photo Grid */}
      <div>
        <h2 className="section-title">Photos ({collection.photos?.length ?? 0} shown)</h2>
        <div className="grid grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {collection.photos?.map((photo: any, idx: number) => (
            <div
              key={photo.id}
              className={`photo-card ${photo.is_selected ? 'selected' : ''}`}
            >
              {/* Placeholder colored tile for demo */}
              <div className={`w-full h-full ${COLORS[idx % COLORS.length]} flex items-center justify-center`}>
                <span className="text-[10px] text-slate-400 font-mono">{String(idx + 1).padStart(3, '0')}</span>
              </div>
              <div className="overlay" />
              <div className="check">
                <Check size={12} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center">
          Photo thumbnails will appear here when real photos are uploaded via the backend
        </p>
      </div>
    </div>
  );
}
