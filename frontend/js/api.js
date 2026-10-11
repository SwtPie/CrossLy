// Thin wrapper around window.pywebview.api.
// Every backend call goes through CrossLy.api.call so errors are handled
// in one place: the backend returns {"error": "..."} on failure.
window.CrossLy = window.CrossLy || {};

(function () {
  let readyPromise = null;

  // Resolves when pywebview has injected its API, or rejects after a delay
  // (which happens when index.html is opened in a plain browser during dev).
  function whenReady() {
    if (readyPromise) return readyPromise;
    readyPromise = new Promise((resolve, reject) => {
      if (window.pywebview && window.pywebview.api) {
        resolve(window.pywebview.api);
        return;
      }
      const timer = setTimeout(
        () => reject(new Error(CrossLy.strings.errors.backendUnavailable)),
        3000
      );
      window.addEventListener("pywebviewready", () => {
        clearTimeout(timer);
        resolve(window.pywebview.api);
      });
    });
    return readyPromise;
  }

  async function call(method, ...args) {
    const api = await whenReady();
    const result = await api[method](...args);
    if (result && typeof result === "object" && !Array.isArray(result) && result.error) {
      throw new Error(result.error);
    }
    return result;
  }

  CrossLy.api = { call, whenReady };
})();
