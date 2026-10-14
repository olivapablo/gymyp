window.FITTRACK = window.FITTRACK || {};

/**
 * FITTRACK — Offline Queue
 * Saves workout writes to localStorage when offline,
 * and flushes them to Firestore when back online.
 */
(function () {
  const QUEUE_KEY = 'fittrack_offline_queue';

  function getQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
  }

  function saveQueue(queue) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); }
    catch (e) { console.warn('[OfflineQueue] Could not save queue:', e); }
  }

  function enqueueWrite(type, data) {
    const queue = getQueue();
    queue.push({ type, data, ts: Date.now() });
    saveQueue(queue);
    console.log('[OfflineQueue] Enqueued offline write:', type);
  }

  async function flushQueue() {
    const queue = getQueue();
    if (!queue.length) return;
    console.log('[OfflineQueue] Flushing', queue.length, 'pending item(s)...');

    const remaining = [];
    for (const item of queue) {
      try {
        if (item.type === 'finishWorkout') {
          const { workoutId, workoutData } = item.data;
          // Re-attempt the Firestore write using the existing finishWorkout function
          await window.FITTRACK.finishWorkout(workoutId, workoutData);
          console.log('[OfflineQueue] Synced item:', item.type);
        }
      } catch (e) {
        console.warn('[OfflineQueue] Failed to sync item, will retry:', e);
        remaining.push(item);
      }
    }

    saveQueue(remaining);

    if (remaining.length === 0 && queue.length > 0) {
      if (window.FITTRACK.toast) {
        window.FITTRACK.toast('☁ Entrenamientos sincronizados correctamente');
      }
    }
  }

  // Auto-flush when back online
  window.addEventListener('online', () => {
    console.log('[OfflineQueue] Connection restored — syncing pending writes...');
    setTimeout(flushQueue, 1500); // small delay for the connection to stabilize
  });

  // Expose
  window.FITTRACK.offlineQueue = {
    enqueueWrite,
    flushQueue,
    getQueue,
    hasPending: () => getQueue().length > 0
  };
})();
