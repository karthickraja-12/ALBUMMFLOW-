import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const isElectron = typeof window !== 'undefined' && navigator.userAgent.toLowerCase().includes('electron');

const api = axios.create({
  baseURL: isElectron ? 'http://localhost:3001/api' : '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Demo Mode Mock Backend Simulation ───────────────────────

const MOCK_STATS_KEY = 'albumflow_demo_stats';
const MOCK_COLLECTIONS_KEY = 'albumflow_demo_collections';
const MOCK_BRANDING_KEY = 'albumflow_demo_branding';
const MOCK_DRIVE_KEY = 'albumflow_demo_drive';

const DEFAULT_STATS = {
  total_collections: 7,
  pending_collections: 4,
  completed_collections: 3,
  total_photos: 2133,
  total_selected: 277,
  selection_rate: 35,
};

const DEFAULT_COLLECTIONS = [
  { id: '1', collection_name: 'Arun & Priya Wedding', client_name: 'Arun Kumar', event_type: 'Wedding', status: 'EXPORTED', total_photos: 540, selected_photos: 162, created_at: '2024-05-15', event_date: '2024-05-12', client_access_token: 'demo-tok-1', upload_completed: true },
  { id: '2', collection_name: 'Meera Birthday Celebration', client_name: 'Meera Nair', event_type: 'Birthday', status: 'CLIENT_VIEWING', total_photos: 210, selected_photos: 0, created_at: '2024-05-20', event_date: '2024-05-18', client_access_token: 'demo-tok-2', upload_completed: true },
  { id: '3', collection_name: 'Raj & Sunita Reception', client_name: 'Raj Patel', event_type: 'Reception', status: 'CONFIRMED', total_photos: 380, selected_photos: 115, created_at: '2024-05-22', event_date: '2024-05-20', client_access_token: 'demo-tok-3', upload_completed: true },
  { id: '4', collection_name: 'Corporate Annual Meet', client_name: 'TechCorp Ltd', event_type: 'Corporate Event', status: 'AWAITING_CLIENT', total_photos: 290, selected_photos: 0, created_at: '2024-05-25', event_date: '2024-05-24', client_access_token: 'demo-tok-4', upload_completed: true },
  { id: '5', collection_name: 'Deepa Engagement', client_name: 'Deepa Menon', event_type: 'Engagement', status: 'READY', total_photos: 175, selected_photos: 0, created_at: '2024-05-28', event_date: '2024-05-26', client_access_token: 'demo-tok-5', upload_completed: true },
  { id: '6', collection_name: 'Suresh Anniversary Shoot', client_name: 'Suresh Iyer', event_type: 'Anniversary', status: 'AWAITING_CLIENT', total_photos: 320, selected_photos: 0, created_at: '2024-06-01', event_date: '2024-05-30', client_access_token: 'demo-tok-6', upload_completed: true },
  { id: '7', collection_name: 'Krishna Baby Shower', client_name: 'Lakshmi Krishna', event_type: 'Baby Shower', status: 'UPLOADING', total_photos: 98, selected_photos: 0, created_at: '2024-06-05', event_date: '2024-06-04', client_access_token: 'demo-tok-7', upload_completed: false },
];

const DEFAULT_BRANDING = {
  logo_url: null,
  watermark_type: 'TEXT',
  watermark_text: 'Dream Frames Studio',
  watermark_position: 'BOTTOM_RIGHT',
  watermark_opacity: 30,
  show_phone: true,
  show_website: true,
};

const DEFAULT_DRIVE = {
  is_connected: false,
  google_email: '',
  last_sync: null,
};

function getStored<T>(key: string, defaultValue: T): T {
  const data = sessionStorage.getItem(key);
  if (!data) {
    sessionStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

// Helper to get nice Unsplash photography urls
const UNSPLASH_PHOTOS: Record<string, string[]> = {
  wedding: [
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&w=600&q=80',
  ],
  birthday: [
    'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=600&q=80',
  ],
  corporate: [
    'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80',
  ],
  default: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  ],
};

export function getRandomPhotoUrl(eventType: string, index: number): string {
  const type = eventType?.toLowerCase() || '';
  let pool = UNSPLASH_PHOTOS.default;
  if (type.includes('wed') || type.includes('recep') || type.includes('engag')) {
    pool = UNSPLASH_PHOTOS.wedding;
  } else if (type.includes('birth') || type.includes('baby') || type.includes('anniv')) {
    pool = UNSPLASH_PHOTOS.birthday;
  } else if (type.includes('corp') || type.includes('meet')) {
    pool = UNSPLASH_PHOTOS.corporate;
  }
  return pool[index % pool.length];
}

// Generate collections photos list
function getCollectionPhotos(collectionId: string, count: number, eventType: string) {
  const key = `albumflow_demo_photos_${collectionId}`;
  const stored = sessionStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  const list = Array.from({ length: count }, (_, i) => ({
    id: `photo-${collectionId}-${i + 1}`,
    original_filename: `IMG_${String(i + 1).padStart(4, '0')}.jpg`,
    s3_preview_key: null,
    preview_url: getRandomPhotoUrl(eventType, i),
    upload_status: 'READY',
    width: 4000,
    height: 3000,
    is_selected: i % 4 === 0,
  }));
  sessionStorage.setItem(key, JSON.stringify(list));
  return list;
}

function handleMockResponse(config: any): Promise<any> {
  const url = config.url || '';
  const method = config.method?.toUpperCase() || 'GET';
  let data: any = {};
  if (config.data) {
    try {
      data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    } catch {
      data = config.data;
    }
  }

  // GET /analytics
  if (url === '/analytics') {
    const stats = getStored(MOCK_STATS_KEY, DEFAULT_STATS);
    return Promise.resolve({ data: { stats } });
  }

  // GET /collections
  if (url.startsWith('/collections') && method === 'GET') {
    const collections = getStored(MOCK_COLLECTIONS_KEY, DEFAULT_COLLECTIONS);
    return Promise.resolve({ data: { collections } });
  }

  // GET /collections/:id
  const collectionDetailMatch = url.match(/^\/collections\/([^/]+)$/);
  if (collectionDetailMatch && method === 'GET') {
    const id = collectionDetailMatch[1];
    const collections = getStored(MOCK_COLLECTIONS_KEY, DEFAULT_COLLECTIONS);
    const collection = collections.find((c: any) => c.id === id);
    if (!collection) {
      return Promise.reject({ response: { status: 404, data: { error: 'Collection not found' } } });
    }
    const photos = getCollectionPhotos(collection.id, collection.total_photos, collection.event_type);
    return Promise.resolve({
      data: {
        collection: {
          ...collection,
          photos,
        },
      },
    });
  }

  // POST /collections
  if (url === '/collections' && method === 'POST') {
    const collections = getStored(MOCK_COLLECTIONS_KEY, DEFAULT_COLLECTIONS);
    const newId = String(collections.length + 1);
    const newColl = {
      id: newId,
      collection_name: data.collection_name,
      client_name: data.client_name,
      event_type: data.event_type,
      event_date: data.event_date,
      status: 'READY',
      total_photos: 0,
      selected_photos: 0,
      created_at: new Date().toISOString().split('T')[0],
      client_access_token: `demo-tok-${newId}`,
      upload_completed: false,
    };
    collections.unshift(newColl);
    setStored(MOCK_COLLECTIONS_KEY, collections);

    // Update stats
    const stats = getStored(MOCK_STATS_KEY, DEFAULT_STATS);
    stats.total_collections = collections.length;
    setStored(MOCK_STATS_KEY, stats);

    return Promise.resolve({ data: { collection: newColl } });
  }

  // PATCH /collections/:id
  const collectionPatchMatch = url.match(/^\/collections\/([^/]+)$/);
  if (collectionPatchMatch && method === 'PATCH') {
    const id = collectionPatchMatch[1];
    const collections = getStored(MOCK_COLLECTIONS_KEY, DEFAULT_COLLECTIONS);
    const index = collections.findIndex((c: any) => c.id === id);
    if (index !== -1) {
      collections[index] = { ...collections[index], ...data };
      setStored(MOCK_COLLECTIONS_KEY, collections);
      return Promise.resolve({ data: { collection: collections[index] } });
    }
  }

  // POST /upload/presign
  if (url === '/upload/presign' && method === 'POST') {
    return Promise.resolve({
      data: {
        photo_id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        presigned_url: 'mock-upload',
      },
    });
  }

  // POST /upload/complete
  if (url === '/upload/complete' && method === 'POST') {
    return Promise.resolve({ data: { success: true } });
  }

  // POST /upload/finalize/:id
  const finalizeMatch = url.match(/^\/upload\/finalize\/([^/]+)$/);
  if (finalizeMatch && method === 'POST') {
    const id = finalizeMatch[1];
    const collections = getStored(MOCK_COLLECTIONS_KEY, DEFAULT_COLLECTIONS);
    const index = collections.findIndex((c: any) => c.id === id);
    if (index !== -1) {
      // Simulate adding 12 uploaded photos
      const addedPhotosCount = 12;
      const originalTotal = collections[index].total_photos || 0;
      collections[index].total_photos = originalTotal + addedPhotosCount;
      collections[index].status = 'AWAITING_CLIENT';
      collections[index].upload_completed = true;
      setStored(MOCK_COLLECTIONS_KEY, collections);

      // Seed photo object URLs or links
      const photosKey = `albumflow_demo_photos_${id}`;
      const existingPhotos = getCollectionPhotos(id, originalTotal, collections[index].event_type);
      const newPhotos = Array.from({ length: addedPhotosCount }, (_, i) => ({
        id: `photo-${id}-new-${i + 1}`,
        original_filename: `IMG_NEW_${String(i + 1).padStart(4, '0')}.jpg`,
        s3_preview_key: null,
        preview_url: getRandomPhotoUrl(collections[index].event_type, originalTotal + i),
        upload_status: 'READY',
        width: 4000,
        height: 3000,
        is_selected: false,
      }));
      sessionStorage.setItem(photosKey, JSON.stringify([...existingPhotos, ...newPhotos]));

      // Update global stats
      const stats = getStored(MOCK_STATS_KEY, DEFAULT_STATS);
      stats.total_photos += addedPhotosCount;
      setStored(MOCK_STATS_KEY, stats);
    }
    return Promise.resolve({ data: { success: true } });
  }

  // GET /branding
  if (url === '/branding' && method === 'GET') {
    const branding = getStored(MOCK_BRANDING_KEY, DEFAULT_BRANDING);
    return Promise.resolve({ data: { branding } });
  }

  // PUT /branding
  if (url === '/branding' && method === 'PUT') {
    setStored(MOCK_BRANDING_KEY, data);
    return Promise.resolve({ data: { success: true } });
  }

  // GET /drive/status
  if (url === '/drive/status' && method === 'GET') {
    const drive = getStored(MOCK_DRIVE_KEY, DEFAULT_DRIVE);
    return Promise.resolve({ data: { drive } });
  }

  // GET /drive/connect
  if (url === '/drive/connect' && method === 'GET') {
    return Promise.resolve({ data: { mock: true } });
  }

  // GET /drive/callback
  if (url.startsWith('/drive/callback') && method === 'GET') {
    const drive = {
      is_connected: true,
      google_email: 'demo@dreamframes.com',
      last_sync: new Date().toISOString(),
    };
    setStored(MOCK_DRIVE_KEY, drive);
    return Promise.resolve({ data: { success: true } });
  }

  // POST /drive/disconnect
  if (url === '/drive/disconnect' && method === 'POST') {
    setStored(MOCK_DRIVE_KEY, DEFAULT_DRIVE);
    return Promise.resolve({ data: { success: true } });
  }

  // POST /drive/export/:id
  const exportMatch = url.match(/^\/drive\/export\/([^/]+)$/);
  if (exportMatch && method === 'POST') {
    const id = exportMatch[1];
    const collections = getStored(MOCK_COLLECTIONS_KEY, DEFAULT_COLLECTIONS);
    const index = collections.findIndex((c: any) => c.id === id);
    if (index !== -1) {
      collections[index].status = 'EXPORTED';
      setStored(MOCK_COLLECTIONS_KEY, collections);
    }
    return Promise.resolve({ data: { success: true } });
  }

  // GET /license/info
  if (url === '/license/info' && method === 'GET') {
    return Promise.resolve({
      data: {
        license_status: 'ACTIVE',
        plan: 'PRO',
        license_key: 'AF-DEMO-MODE-ACTIVE-KEYS',
        license: {
          start_date: '2024-01-01',
          expiry_date: '2027-01-01',
        },
      },
    });
  }

  // POST /license/validate
  if (url === '/license/validate' && method === 'POST') {
    return Promise.resolve({
      data: {
        status: 'ACTIVE',
        plan: 'PRO',
      },
    });
  }

  return Promise.reject({ response: { status: 404, data: { error: `Endpoint mock not found: ${url}` } } });
}

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token === 'demo-token-no-backend-needed') {
    return Promise.reject({
      isMock: true,
      config,
    });
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — logout and catch mock requests
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.isMock) {
      return handleMockResponse(err.config);
    }
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
