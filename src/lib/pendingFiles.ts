// Simple module-level singleton store for passing a selected file between pages
// Note: Works within the same browser tab and SPA navigation.

const store = new Map<string, File>();

export type PendingKey = 'pointcloud' | 'pickle';

export function setPendingFile(key: PendingKey, file: File) {
  store.set(key, file);
}

export function getPendingFile(key: PendingKey): File | undefined {
  return store.get(key);
}

export function clearPendingFile(key: PendingKey) {
  store.delete(key);
}

export function popPendingFile(key: PendingKey): File | undefined {
  const f = store.get(key);
  if (f) store.delete(key);
  return f;
}
