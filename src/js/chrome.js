import { askForApiKey } from "./api.js";

/**
 * Inicializa comportamentos compartilhados entre todas as páginas.
 * Mantém o JS das telas menor e evita repetir a lógica de header, topo e API Key.
 */
export function setupChrome() {
  const header = document.querySelector("[data-header]");
  const topButton = document.querySelector("[data-back-to-top]");

  const updateScrollState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 30);
    topButton?.classList.toggle("is-visible", window.scrollY > 600);
  };

  window.addEventListener("scroll", updateScrollState, { passive: true });
  topButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-api-key-button]")) askForApiKey();
  });

  updateScrollState();
}
