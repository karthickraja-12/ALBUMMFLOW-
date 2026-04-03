export const logger = {
  error: async (message, details = {}, source = 'client') => {
    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'error', message, details, source })
      });
    } catch (err) {
      console.error("Local log failed:", err);
    }
  },
  warn: async (message, details = {}, source = 'client') => {
    try {
      await fetch('/api/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: 'warn', message, details, source })
      });
    } catch (err) {
      console.error("Local log failed:", err);
    }
  }
};
