import { getFavorites, loadGenres } from "./api.js";
import { movieCard } from "./ui.js";
import { initSearch } from "./search.js";
import { setupChrome } from "./chrome.js";

/** Renderiza os filmes salvos no navegador e mostra um estado vazio amigável. */
import { askForApiKey, getFavorites, loadGenres } from "./api.js";
import { movieCard } from "./ui.js";
import { initSearch } from "./search.js";

function setupChrome() {
  const header = document.querySelector("[data-header]");
  const topButton = document.querySelector("[data-back-to-top]");
  const update = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 30);
    topButton.classList.toggle("is-visible", window.scrollY > 600);
  };
  window.addEventListener("scroll", update, { passive: true });
  topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.addEventListener("click", (event) => {
    if (event.target.matches("[data-api-key-button]")) askForApiKey();
  });
  update();
}

async function renderFavorites() {
  const grid = document.querySelector("[data-favorites-grid]");
  try { await loadGenres(); } catch { /* Favoritos continuam aparecendo sem gêneros traduzidos. */ }
  const favorites = getFavorites();
  grid.innerHTML = favorites.length
    ? favorites.map(movieCard).join("")
    : `<div class="empty-state"><h2>Nenhum favorito salvo ainda.</h2><p>Adicione filmes aos favoritos pela página de detalhes ou pelo banner principal.</p><a class="btn" href="../../index.html">Explorar filmes</a></div>`;
}

setupChrome();
initSearch();
renderFavorites();
