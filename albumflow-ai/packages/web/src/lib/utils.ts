// Utility helpers
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    UPLOADING: 'badge-uploading',
    PROCESSING: 'badge-processing',
    READY: 'badge-ready',
    AWAITING_CLIENT: 'badge-awaiting',
    CLIENT_VIEWING: 'badge-viewing',
    CONFIRMED: 'badge-confirmed',
    EXPORTED: 'badge-exported',
    ARCHIVED: 'badge-archived',
  };
  return map[status] ?? 'badge';
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    UPLOADING: 'Uploading',
    PROCESSING: 'Processing',
    READY: 'Ready',
    AWAITING_CLIENT: 'Awaiting Client',
    CLIENT_VIEWING: 'Client Viewing',
    CONFIRMED: 'Confirmed',
    EXPORTED: 'Exported',
    ARCHIVED: 'Archived',
    DELETED: 'Deleted',
  };
  return map[status] ?? status;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str;
}
