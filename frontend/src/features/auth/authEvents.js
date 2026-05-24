const listeners = new Set();

export function onAuthLogout(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

export function emitAuthLogout() {
  listeners.forEach((handler) => {
    try {
      handler();
    } catch (e) {
      // noop
    }
  });
}