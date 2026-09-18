import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./index.css";

const rootElement = document.getElementById("admin-root");
if (!rootElement) {
  throw new Error("Failed to find #admin-root element in DOM.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
