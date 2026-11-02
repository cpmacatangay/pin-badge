import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import App from "./App";
import "./styles/tokens.css";
import "./styles/app.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found.");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
