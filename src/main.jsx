import React from "react";
import { createRoot } from "react-dom/client";
import Abendbrett from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Fängt Renderfehler ab, damit die Seite nicht weiß bleibt */}
    <ErrorBoundary>
      <Abendbrett />
    </ErrorBoundary>
  </React.StrictMode>
);
