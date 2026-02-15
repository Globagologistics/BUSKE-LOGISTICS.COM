
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);

  // Register service worker manually (works even if Vite PWA plugin isn't installed)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }).catch((err) => {
        console.warn('ServiceWorker registration failed: ', err);
      });
    });
  }
  