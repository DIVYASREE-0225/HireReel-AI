import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider.tsx';

// Global API Fetch Interceptor: Prepends VITE_API_URL to relative '/api' endpoints
const originalFetch = window.fetch;

const customFetch = function (input: any, init?: any) {
  let url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
  
  const apiBase = import.meta.env.VITE_API_URL;
  if (apiBase && url.startsWith("/api")) {
    const normalizedBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
    url = `${normalizedBase}${url}`;
  }
  
  if (typeof input === "string") {
    return originalFetch(url, init);
  } else if (input instanceof URL) {
    return originalFetch(new URL(url), init);
  } else {
    // For Request objects, reconstruct them with the new URL
    const newRequest = new Request(url, input);
    return originalFetch(newRequest, init);
  }
};

try {
  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true
  });
} catch (e) {
  console.warn("Failed to redefine window.fetch via Object.defineProperty, attempting direct fallback...", e);
  try {
    (window as any).fetch = customFetch;
  } catch (err) {
    console.error("Critical: fetch override failed absolutely.", err);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
