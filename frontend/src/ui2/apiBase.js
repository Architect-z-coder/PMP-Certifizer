// Preview deployments carry no VITE_API_URL (it is a Production-only variable in Vercel). api.js then
// targets its own default, http://localhost:8000. Inside the Chantier interface only, that default is
// redirected to the Render backend: api.js is untouched, and nothing changes when VITE_API_URL is set.
export const API_FALLBACK = "https://pmp-cerifizer.onrender.com";
const LOCAL_DEFAULT = "http://localhost:8000";
export const API_BASE = (import.meta.env.VITE_API_URL || API_FALLBACK).replace(/\/$/, "");

if (!import.meta.env.VITE_API_URL && typeof window !== "undefined" && typeof window.fetch === "function" && !window.__ui2ApiFallback) {
  const orig = window.fetch.bind(window);
  const swap = (u) => (u.startsWith(LOCAL_DEFAULT) ? API_FALLBACK + u.slice(LOCAL_DEFAULT.length) : u);
  window.fetch = (input, init) => {
    if (typeof input === "string") return orig(swap(input), init);
    if (input instanceof URL) return orig(swap(input.href), init);
    if (input && typeof input.url === "string" && input.url.startsWith(LOCAL_DEFAULT)) return orig(new Request(swap(input.url), input), init);
    return orig(input, init);
  };
  window.__ui2ApiFallback = API_FALLBACK;
}
