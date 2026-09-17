// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx"; // 🎯 src 바로 밑에 있는 중앙 관제탑 App.tsx를 정확히 수입!
import "./index.css";
import { readSession } from './lib/api';

// Previous releases stored unsigned profile JSON. Require a fresh login after this upgrade.
readSession();
window.addEventListener('auth-expired', () => window.location.assign('/login'));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
