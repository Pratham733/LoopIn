// Utility for offline message/conversation queueing

export function queueOfflineAction(actionType, payload) {
  const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
  queue.push({ actionType, payload, timestamp: Date.now() });
  localStorage.setItem('offlineQueue', JSON.stringify(queue));
}

export function getOfflineQueue() {
  return JSON.parse(localStorage.getItem('offlineQueue') || '[]');
}

export function clearOfflineQueue() {
  localStorage.removeItem('offlineQueue');
}

export async function flushOfflineQueue(handlers) {
  // handlers: { [actionType]: async (payload) => void }
  const queue = getOfflineQueue();
  for (const item of queue) {
    if (handlers[item.actionType]) {
      try {
        await handlers[item.actionType](item.payload);
      } catch (e) {
        // If still offline or failed, stop flushing
        break;
      }
    }
  }
  clearOfflineQueue();
} 