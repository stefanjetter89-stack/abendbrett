import React from "react";
import { createRoot } from "react-dom/client";
import Abendbrett from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Abendbrett />
  </React.StrictMode>
);
