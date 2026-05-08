const STORAGE_FALLBACK_SCRIPT = `<script>
(() => {
  const createStorage = () => {
    const store = new Map();
    return {
      get length() { return store.size; },
      key(index) { return Array.from(store.keys())[index] ?? null; },
      getItem(key) { return store.has(String(key)) ? store.get(String(key)) : null; },
      setItem(key, value) { store.set(String(key), String(value)); },
      removeItem(key) { store.delete(String(key)); },
      clear() { store.clear(); },
    };
  };

  const ensureStorage = (name) => {
    try {
      window[name].getItem('__pharaohfolio_storage_probe__');
    } catch {
      Object.defineProperty(window, name, {
        configurable: true,
        value: createStorage(),
      });
    }
  };

  ensureStorage('localStorage');
  ensureStorage('sessionStorage');
})();
</script>`;

export const withSandboxStorageFallback = (html = '') => {
  if (!html || html.includes('__pharaohfolio_storage_probe__')) {
    return html;
  }

  if (/<head(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, match => `${match}${STORAGE_FALLBACK_SCRIPT}`);
  }

  if (/<html(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<html(\s[^>]*)?>/i, match => `${match}<head>${STORAGE_FALLBACK_SCRIPT}</head>`);
  }

  return `${STORAGE_FALLBACK_SCRIPT}${html}`;
};

export { STORAGE_FALLBACK_SCRIPT };
