export const cameraStore = {
  stream: null,
  videoEl: null,
  isStreaming: false,
  listeners: new Set(),

  init() {
    // Call once at app start — DOM is ready by then
    this.videoEl = document.getElementById("hidden-video");
    console.log("[cameraStore] videoEl:", this.videoEl);
  },

  setStreaming(val) {
    this.isStreaming = val;
    this.listeners.forEach((fn) => fn(val));
  },

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
};