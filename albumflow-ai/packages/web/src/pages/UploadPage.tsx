import { useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Upload, CheckCircle2, Loader2, X, FileImage,
  CloudUpload, FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatFileSize } from '@/lib/utils';
import clsx from 'clsx';

interface UploadFile {
  id: string;
  file: File;
  status: 'queued' | 'uploading' | 'done' | 'error';
  progress: number;
  photo_id?: string;
}

export default function UploadPage() {
  const { id: collectionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  const { data: collectionData } = useQuery({
    queryKey: ['collection', collectionId],
    queryFn: () => api.get(`/collections/${collectionId}`).then((r) => r.data),
  });

  const collection = collectionData?.collection;

  function addFiles(newFiles: FileList | File[]) {
    const valid = Array.from(newFiles).filter((f) =>
      ['image/jpeg', 'image/jpg', 'image/png'].includes(f.type)
    );
    if (valid.length !== newFiles.length) {
      toast.error('Only JPG and PNG files are supported');
    }
    setFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({
        id: `${f.name}-${f.size}-${Date.now()}`,
        file: f,
        status: 'queued' as const,
        progress: 0,
      })),
    ]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function startUpload() {
    if (!files.length || isUploading) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === 'done') continue;

      setFiles((prev) => prev.map((x) => x.id === f.id ? { ...x, status: 'uploading' } : x));

      try {
        // Get presigned URL
        const presignRes = await api.post('/upload/presign', {
          collection_id: collectionId,
          filename: f.file.name,
          file_size: f.file.size,
          file_type: f.file.type,
        });

        const { photo_id, presigned_url } = presignRes.data;

        // If mock mode, skip actual S3 upload
        if (!presigned_url.includes('mock-upload')) {
          await fetch(presigned_url, {
            method: 'PUT',
            body: f.file,
            headers: { 'Content-Type': f.file.type },
          });
        }

        // Mark complete
        await api.post('/upload/complete', { photo_id });

        setFiles((prev) => prev.map((x) =>
          x.id === f.id ? { ...x, status: 'done', progress: 100, photo_id } : x
        ));
      } catch {
        setFiles((prev) => prev.map((x) =>
          x.id === f.id ? { ...x, status: 'error' } : x
        ));
      }
    }

    // Finalize upload
    try {
      await api.post(`/upload/finalize/${collectionId}`);
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setUploadDone(true);
      toast.success(`${files.length} photos uploaded successfully!`);
    } catch {
      toast.error('Failed to finalize upload');
    }

    setIsUploading(false);
  }

  const doneCount = files.filter((f) => f.status === 'done').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  if (uploadDone) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Upload Complete!</h2>
        <p className="text-sm text-slate-500 mb-6">
          {doneCount} photos uploaded successfully. Your collection is now ready.
        </p>
        <div className="flex gap-3">
          <Link to={`/collections/${collectionId}`} className="btn-primary">View Collection</Link>
          <Link to="/collections" className="btn-secondary">All Collections</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="page-header">
        <Link to={`/collections/${collectionId}`} className="btn-ghost btn-sm mb-4 -ml-2 inline-flex">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="page-title">Upload Photos</h1>
        <p className="page-subtitle">{collection?.collection_name} · {collection?.client_name}</p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          'card border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150',
          'h-64 mb-6',
          isDragging ? 'border-navy-700 bg-slate-50 scale-[1.01]' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <CloudUpload size={24} className="text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Drop photos here or click to browse</p>
        <p className="text-xs text-slate-400 mt-1">Supports JPG, JPEG, PNG · Up to 10,000 photos</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="card mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileImage size={16} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700">{files.length} files · {formatFileSize(totalSize)}</span>
            </div>
            {!isUploading && (
              <button onClick={() => setFiles([])} className="btn-ghost btn-sm px-2">
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                <div className={clsx(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                  f.status === 'done' ? 'bg-emerald-50' : f.status === 'error' ? 'bg-red-50' : f.status === 'uploading' ? 'bg-blue-50' : 'bg-slate-100'
                )}>
                  {f.status === 'done' ? <CheckCircle2 size={14} className="text-emerald-600" /> :
                   f.status === 'uploading' ? <Loader2 size={14} className="text-blue-600 animate-spin" /> :
                   f.status === 'error' ? <X size={14} className="text-red-500" /> :
                   <FileImage size={14} className="text-slate-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{f.file.name}</p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(f.file.size)}</p>
                </div>
                {!isUploading && f.status !== 'done' && (
                  <button onClick={() => removeFile(f.id)} className="text-slate-300 hover:text-slate-500">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Progress summary */}
          {isUploading && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Uploading…</span>
                <span>{doneCount} / {files.length}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy-700 rounded-full transition-all duration-300"
                  style={{ width: `${files.length ? (doneCount / files.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link to={`/collections/${collectionId}`} className="btn-secondary">
          Cancel
        </Link>
        <button
          onClick={startUpload}
          disabled={!files.length || isUploading}
          className="btn-primary flex-1"
        >
          {isUploading ? (
            <><Loader2 size={16} className="animate-spin" /> Uploading {doneCount} of {files.length}…</>
          ) : (
            <><Upload size={16} /> Upload {files.length > 0 ? `${files.length} Photos` : 'Photos'}</>
          )}
        </button>
      </div>
    </div>
  );
}
