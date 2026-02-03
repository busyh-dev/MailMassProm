// hooks/queuedRequests.js

const STORAGE_KEY = "emailActionQueue";
const queueEvent = new Event("queue-updated");


export const getQueue = () =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  
  export const queueRequest = (action) => {
    const queue = getQueue();
    queue.push(action);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  
    window.dispatchEvent(queueEvent);
  };
  
  export const clearQueue = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(queueEvent);
  };
  
  export const flushQueue = async (handler) => {
    const queue = getQueue();
    if (!queue.length) return;
  
    clearQueue();
  
    for (const action of queue) {
      await handler(action);
    }
  
    window.dispatchEvent(queueEvent);
  };
