import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Phone, Globe, Images, AlertTriangle, X, Lock } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import clsx from 'clsx';

const publicApi = axios.create({ baseURL: '/api' });

// ── Public Gallery Mock Simulator for Demo Mode ──────────────

const UNSPLASH_PHOTOS = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
];

function handleMockPublicResponse(config: any): Promise<any> {
  const url = config.url || '';
  const method = config.method?.toUpperCase() || 'GET';
  let payload: any = {};
  if (config.data) {
    try {
      payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      payload = config.data;
    }
  }

  const urlParts = url.split('/');
  const token = urlParts[urlParts.length - 1] === 'select' || urlParts[urlParts.length - 1] === 'confirm'
    ? urlParts[urlParts.length - 2]
    : urlParts[urlParts.length - 1];

  const collectionsData = sessionStorage.getItem('albumflow_demo_collections');
  const collections = collectionsData ? JSON.parse(collectionsData) : [];
  
  let collection = collections.find((c: any) => c.client_access_token === token || `demo-tok-${c.id}` === token);
  
  if (!collection) {
    const id = token.replace('demo-tok-', '') || '1';
    collection = {
      id,
      collection_name: 'Arun & Priya Wedding',
      client_name: 'Arun Kumar',
      event_type: 'Wedding',
      status: 'AWAITING_CLIENT',
      total_photos: 48,
      selected_photos: 0,
      client_access_token: token,
    };
  }

  const photosKey = `albumflow_demo_photos_${collection.id}`;
  let photos = [];
  const storedPhotos = sessionStorage.getItem(photosKey);
  if (storedPhotos) {
    photos = JSON.parse(storedPhotos);
  } else {
    const totalPhotos = collection.total_photos || 24;
    const isMockPending = collection.status === 'AWAITING_CLIENT' || collection.status === 'CLIENT_VIEWING' || collection.status === 'READY';
    photos = Array.from({ length: totalPhotos }, (_, i) => {
      const index = i + 1;
      const isLocked = isMockPending && index !== 3; // Lock all except the 3rd link/photo for demo
      return {
        id: `photo-${collection.id}-${index}`,
        original_filename: `IMG_${String(index).padStart(4, '0')}.jpg`,
        preview_url: UNSPLASH_PHOTOS[i % UNSPLASH_PHOTOS.length],
        is_selected: i % 5 === 0,
        is_locked: isLocked,
        photo_index: index,
      };
    });
    sessionStorage.setItem(photosKey, JSON.stringify(photos));
  }

  if (method === 'GET') {
    return Promise.resolve({
      data: {
        session_token: 'demo-client-session-token',
        collection: {
          id: collection.id,
          collection_name: collection.collection_name,
          total_photos: photos.length,
          is_confirmed: collection.status === 'CONFIRMED' || collection.status === 'EXPORTED',
        },
        studio: {
          name: 'Dream Frames Studio',
          phone: '+91 98765 43210',
          website: 'https://dreamframes.com',
          branding: {
            logo_url: null,
            watermark_type: 'TEXT',
            watermark_text: 'Dream Frames Studio',
            watermark_position: 'BOTTOM_RIGHT',
            watermark_opacity: 30,
          },
        },
        photos,
      },
    });
  }

  if (method === 'POST' && url.endsWith('/select')) {
    const { photo_id, selected } = payload;
    const updatedPhotos = photos.map((p: any) =>
      p.id === photo_id ? { ...p, is_selected: selected } : p
    );
    sessionStorage.setItem(photosKey, JSON.stringify(updatedPhotos));

    const selectedCount = updatedPhotos.filter((p: any) => p.is_selected).length;
    if (collectionsData) {
      const idx = collections.findIndex((c: any) => c.id === collection.id);
      if (idx !== -1) {
        collections[idx].selected_photos = selectedCount;
        collections[idx].total_photos = updatedPhotos.length;
        sessionStorage.setItem('albumflow_demo_collections', JSON.stringify(collections));
      }
    }
    return Promise.resolve({ data: { success: true } });
  }

  if (method === 'POST' && url.endsWith('/confirm')) {
    if (collectionsData) {
      const idx = collections.findIndex((c: any) => c.id === collection.id);
      if (idx !== -1) {
        collections[idx].status = 'CONFIRMED';
        const selectedCount = photos.filter((p: any) => p.is_selected).length;
        collections[idx].selected_photos = selectedCount;
        sessionStorage.setItem('albumflow_demo_collections', JSON.stringify(collections));

        const statsData = sessionStorage.getItem('albumflow_demo_stats');
        if (statsData) {
          const stats = JSON.parse(statsData);
          stats.pending_collections = Math.max(0, stats.pending_collections - 1);
          stats.completed_collections += 1;
          stats.total_selected += selectedCount;
          sessionStorage.setItem('albumflow_demo_stats', JSON.stringify(stats));
        }
      }
    }
    return Promise.resolve({ data: { success: true } });
  }

  return Promise.reject({ response: { status: 404, data: { error: 'Not Found' } } });
}

publicApi.interceptors.request.use((config) => {
  const url = config.url || '';
  const isDemo = url.includes('demo-tok-');
  if (isDemo) {
    return Promise.reject({
      isMock: true,
      config,
    });
  }
  return config;
});

publicApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.isMock) {
      return handleMockPublicResponse(err.config);
    }
    return Promise.reject(err);
  }
);

const SESSION_KEY = 'albumflow_session';

function getSessionToken() {
  return sessionStorage.getItem(SESSION_KEY) || undefined;
}

function setSessionToken(token: string) {
  sessionStorage.setItem(SESSION_KEY, token);
}

export default function GalleryPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const sessionTokenRef = useRef<string | undefined>(getSessionToken());

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gallery', token],
    queryFn: async () => {
      const res = await publicApi.get(`/gallery/${token}`, {
        headers: sessionTokenRef.current
          ? { 'x-session-token': sessionTokenRef.current }
          : {},
      });
      if (res.data.session_token) {
        sessionTokenRef.current = res.data.session_token;
        setSessionToken(res.data.session_token);
      }
      return res.data;
    },
    retry: false,
  });

  const selectMutation = useMutation({
    mutationFn: ({ photo_id, selected }: { photo_id: string; selected: boolean }) =>
      publicApi.post(`/gallery/${token}/select`, {
        photo_id,
        selected,
        session_token: sessionTokenRef.current,
      }),
  });

  // Pre-populate selections from server
  useEffect(() => {
    if (data?.photos) {
      const preSelected = new Set<string>(
        data.photos.filter((p: any) => p.is_selected).map((p: any) => p.id)
      );
      setSelectedIds(preSelected);
    }
  }, [data?.photos?.length]);

  function togglePhoto(id: string) {
    if (isConfirmed) return;
    const photo = photos?.find((p: any) => p.id === id);
    if (photo?.is_locked) {
      toast.error('This photo is locked. Please pay the photographer to unlock it.');
      return;
    }
    const newSelected = !selectedIds.has(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (newSelected) next.add(id);
      else next.delete(id);
      return next;
    });
    selectMutation.mutate({ photo_id: id, selected: newSelected });
  }

  async function confirmSelection() {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one photo before confirming');
      return;
    }
    setIsConfirming(true);
    try {
      await publicApi.post(`/gallery/${token}/confirm`);
      toast.success('Selection confirmed successfully!');
      navigate(`/gallery/${token}/confirmed`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Confirmation failed. Please try again.');
    } finally {
      setIsConfirming(false);
      setShowConfirmModal(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-navy-700 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your gallery…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Gallery Not Found</h1>
          <p className="text-sm text-slate-500">
            This gallery link is invalid or has expired. Please contact your photographer.
          </p>
        </div>
      </div>
    );
  }

  const { collection, studio, photos } = data;
  const isConfirmed = collection.is_confirmed;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Studio Header ───────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 shadow-subtle">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {studio.branding?.logo_url ? (
            <img src={studio.branding.logo_url} alt="Studio Logo" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">
                {studio.name?.charAt(0) ?? 'S'}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 text-sm leading-none truncate">{studio.name}</p>
            <div className="flex items-center gap-3 mt-1">
              {studio.phone && (
                <a href={`tel:${studio.phone}`} className="text-xs text-slate-500 flex items-center gap-1 hover:text-navy-700">
                  <Phone size={11} /> {studio.phone}
                </a>
              )}
              {studio.website && (
                <a href={studio.website} target="_blank" rel="noopener noreferrer" className="text-xs text-slate-500 flex items-center gap-1 hover:text-navy-700 truncate">
                  <Globe size={11} /> {studio.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
          {!isConfirmed && (
            <div className="flex-shrink-0 bg-navy-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {selectedIds.size} selected
            </div>
          )}
        </div>

        {/* Collection Info */}
        <div className="border-t border-slate-50 bg-slate-50/50">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-800">{collection.collection_name}</p>
              <p className="text-xs text-slate-500">{collection.total_photos} photos · Tap to select</p>
            </div>
            {isConfirmed && (
              <span className="badge-confirmed">Selection Locked</span>
            )}
          </div>
        </div>
      </header>

      {/* ── Photo Grid ──────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-2 py-4 pb-32">
        {photos.length === 0 ? (
          <div className="empty-state pt-20">
            <div className="empty-icon"><Images size={24} className="text-slate-400" /></div>
            <p className="text-sm font-medium text-slate-600">No photos available yet</p>
            <p className="text-xs text-slate-400 mt-1">Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
            {photos.map((photo: any) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div
                  key={photo.id}
                  className={clsx(
                    'photo-card',
                    isSelected && 'selected',
                    photo.is_locked && 'cursor-not-allowed border border-dashed border-slate-200 bg-slate-50'
                  )}
                  onClick={() => togglePhoto(photo.id)}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Photo ${photo.id}`}
                >
                  {photo.preview_url ? (
                    <img
                      src={photo.preview_url}
                      alt=""
                      loading="lazy"
                      className={clsx(
                        'w-full h-full object-cover select-none pointer-events-none transition-all duration-300',
                        photo.is_locked && 'filter blur-[4px] brightness-[0.7]'
                      )}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <Images size={20} className="text-slate-300" />
                    </div>
                  )}
                  
                  {photo.is_locked && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px] text-white z-10 gap-1.5 p-2 text-center select-none">
                      <div className="w-8 h-8 rounded-full bg-slate-900/70 flex items-center justify-center backdrop-blur-sm border border-white/20">
                        <Lock size={14} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-900/50 px-2 py-0.5 rounded-full border border-white/10">
                        Locked
                      </span>
                    </div>
                  )}
                  
                  <div className="overlay" />
                  {!photo.is_locked && (
                    <div className="check">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Bottom Sticky Bar ────────────────────────── */}
      {!isConfirmed && photos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">
                {selectedIds.size > 0
                  ? `${selectedIds.size} photo${selectedIds.size !== 1 ? 's' : ''} selected`
                  : 'Tap photos to select'}
              </p>
              <p className="text-xs text-slate-400">
                {photos.length - selectedIds.size} remaining
              </p>
            </div>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={selectedIds.size === 0}
              className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ───────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-amber-500" />
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Confirm Your Selection?</h3>
            <p className="text-sm text-slate-500 mb-1">
              You've selected <strong className="text-slate-800">{selectedIds.size} photo{selectedIds.size !== 1 ? 's' : ''}</strong>.
            </p>
            <p className="text-sm text-amber-600 font-medium mb-6">
              ⚠️ Selections cannot be modified after confirmation.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="btn-secondary flex-1">
                Go Back
              </button>
              <button
                onClick={confirmSelection}
                disabled={isConfirming}
                className="btn-primary flex-1"
              >
                {isConfirming ? <Loader2 size={16} className="animate-spin" /> : null}
                {isConfirming ? 'Confirming…' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
