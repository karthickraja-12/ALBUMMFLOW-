import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const EVENT_TYPES = [
  'Wedding', 'Reception', 'Engagement', 'Birthday', 'Anniversary',
  'Corporate Event', 'Baby Shower', 'Graduation', 'Product Shoot', 'Other',
];

const schema = z.object({
  collection_name: z.string().min(2, 'Collection name is required'),
  client_name: z.string().min(2, 'Client name is required'),
  event_type: z.string().min(1, 'Event type is required'),
  event_date: z.string().min(1, 'Event date is required'),
});
type CreateForm = z.infer<typeof schema>;

export default function CreateCollectionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      event_type: 'Wedding',
      event_date: new Date().toISOString().split('T')[0],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/collections', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      toast.success('Collection created successfully!');
      navigate(`/collections/${res.data.collection.id}/upload`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create collection');
    },
  });

  return (
    <div className="animate-fade-in max-w-lg">
      <div className="page-header">
        <Link to="/collections" className="btn-ghost btn-sm mb-4 -ml-2 inline-flex">
          <ArrowLeft size={16} /> Back to Collections
        </Link>
        <h1 className="page-title">Create Collection</h1>
        <p className="page-subtitle">Set up a new photo gallery for your client</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div className="form-group">
            <label className="label">Collection Name <span className="text-red-400">*</span></label>
            <input
              {...register('collection_name')}
              className={`input ${errors.collection_name ? 'input-error' : ''}`}
              placeholder="e.g. Arun & Priya Wedding"
            />
            {errors.collection_name && (
              <p className="text-xs text-red-500 mt-1">{errors.collection_name.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="label">Client Name <span className="text-red-400">*</span></label>
            <input
              {...register('client_name')}
              className={`input ${errors.client_name ? 'input-error' : ''}`}
              placeholder="e.g. Arun Kumar"
            />
            {errors.client_name && (
              <p className="text-xs text-red-500 mt-1">{errors.client_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Event Type <span className="text-red-400">*</span></label>
              <select {...register('event_type')} className={`input ${errors.event_type ? 'input-error' : ''}`}>
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Event Date <span className="text-red-400">*</span></label>
              <input
                {...register('event_date')}
                type="date"
                className={`input ${errors.event_date ? 'input-error' : ''}`}
              />
              {errors.event_date && (
                <p className="text-xs text-red-500 mt-1">{errors.event_date.message}</p>
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Link to="/collections" className="btn-secondary flex-1">Cancel</Link>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="btn-primary flex-1"
            >
              {(isSubmitting || mutation.isPending) && <Loader2 size={16} className="animate-spin" />}
              {mutation.isPending ? 'Creating…' : 'Create & Upload Photos'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
