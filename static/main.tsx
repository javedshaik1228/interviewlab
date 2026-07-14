import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { InterviewApp } from "../app/components/InterviewApp";
import "../app/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("InterviewLab could not find its application root.");

createRoot(root).render(
  <StrictMode>
    <InterviewApp />
  </StrictMode>,
);
