export const cameraStore = {
  stream: null,
  videoEl: null,
  isStreaming: false,
  listeners: new Set(),

  setStreaming(val) {
    this.isStreaming = val;
    this.listeners.forEach((fn) => fn(val));
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
};
