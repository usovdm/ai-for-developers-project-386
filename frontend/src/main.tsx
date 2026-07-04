import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/app";
import "./styles.css";

async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MSW !== "true") {
    return;
  }

  const { worker } = await import("./test/mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass" });
}

await enableMocking();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
