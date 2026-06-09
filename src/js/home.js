import { detailUrl, formatRating, formatYear, hasApiKey, imageUrl, imageSizes, loadGenres, tmdb, toggleFavorite } from "./api.js";
import { initSearch } from "./search.js";
import { setupChrome } from "./chrome.js";
import { escapeHtml, movieCard } from "./ui.js";

const rows = {
  popular: document.querySelector('[data-row="popular"]'),
  topRated: document.querySelector('[data-row="topRated"]'),
  upcoming: document.querySelector('[data-row="upcoming"]'),
  nowPlaying: document.querySelector('[data-row="nowPlaying"]'),
};
const catalogGrid = document.querySelector("[data-catalog-grid]");
const pageIndicator = document.querySelector("[data-page-indicator]");
let catalogPage = 1;
let isLoadingCatalog = false;
let hasMoreCatalog = true;
const MAX_CATALOG_PAGES = 20;

// Skeletons mantêm a interface estável enquanto a API responde.
function createSkeletons(container, count = 8) {
  container.innerHTML = Array.from({ length: count }, () => `<div class="skeleton skeleton-card"></div>`).join("");
}

function renderError(container, error) {
  container.innerHTML = `<div class="error-state">${error.message}<br><button class="btn" data-api-key-button>Configurar API Key</button></div>`;
}

/** Carrega uma seção horizontal da home usando o endpoint recebido. */
async function loadRow(key, loader) {
  const container = rows[key];
  createSkeletons(container);
  try {
    const data = await loader();
    container.innerHTML = (data.results || []).slice(0, 18).map(movieCard).join("");
  } catch (error) {
    renderError(container, error);
  }
}

/** Usa um filme popular com backdrop como destaque principal da home. */
async function loadHero() {
  const hero = document.querySelector("[data-hero]");
  try {
    const data = await tmdb.popular();
    const movie = (data.results || []).find((item) => item.backdrop_path) || data.results?.[0];
    if (!movie) return;
    const title = escapeHtml(movie.title || "Filme sem título");
    const overview = escapeHtml(movie.overview || "Sinopse indisponível para este título.");
    hero.style.backgroundImage = `url(${imageUrl(movie.backdrop_path, imageSizes.backdrop)})`;
    hero.innerHTML = `
      <div class="hero__content">
        <p class="eyebrow">Destaque popular</p>
        <h1 class="hero__title">${title}</h1>
        <div class="hero__meta"><span>${formatYear(movie.release_date)}</span><span class="rating">★ ${formatRating(movie.vote_average)}</span><span>Popular no TMDB</span></div>
        <div class="hero__stats" aria-label="Resumo do destaque">
          <span><strong>${formatRating(movie.vote_average)}</strong>Nota TMDB</span>
          <span><strong>${formatYear(movie.release_date)}</strong>Ano</span>
          <span><strong>4K</strong>Visual premium</span>
        </div>
        <p class="hero__overview">${overview}</p>
        <div class="hero__actions">
          <a class="btn" href="${detailUrl(movie.id)}">Ver Detalhes</a>
          <button class="btn btn--ghost" data-hero-favorite>+ Favorito</button>
        </div>
      </div>
    `;
    hero.querySelector("[data-hero-favorite]").addEventListener("click", () => {
      const added = toggleFavorite(movie);
      hero.querySelector("[data-hero-favorite]").textContent = added ? "✓ Favorito" : "+ Favorito";
    });
  } catch (error) {
    hero.innerHTML = `<div class="error-state">${error.message}<br><button class="btn" data-api-key-button>Configurar API Key</button></div>`;
  }
}

/** Incrementa o catálogo infinito sem bloquear as demais seções. */
async function loadCatalog() {
  if (isLoadingCatalog || !hasMoreCatalog) return;
  isLoadingCatalog = true;
  try {
    const data = await tmdb.popular(catalogPage);
    await loadGenres();
    catalogGrid.insertAdjacentHTML("beforeend", (data.results || []).map(movieCard).join(""));
    pageIndicator.textContent = `Página ${catalogPage}`;
    catalogPage += 1;
    hasMoreCatalog = catalogPage <= Math.min(data.total_pages || 1, MAX_CATALOG_PAGES);
  } catch (error) {
    if (!catalogGrid.children.length) renderError(catalogGrid, error);
    hasMoreCatalog = false;
  } finally {
    isLoadingCatalog = false;
  }
}

/** Observa o sentinel para carregar mais filmes próximo ao fim da página. */
function setupInfiniteScroll() {
  const sentinel = document.querySelector("[data-infinite-sentinel]");
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) loadCatalog();
  }, { rootMargin: "500px" });
  if (sentinel) observer.observe(sentinel);
}

async function init() {
  setupChrome();
  initSearch();
  Object.values(rows).forEach((row) => createSkeletons(row));
  if (!hasApiKey()) {
    document.querySelector("[data-hero]").innerHTML = `<div class="error-state">Configure sua API Key do TMDB para iniciar.<br><button class="btn" data-api-key-button>Configurar API Key</button></div>`;
  }
  try { await loadGenres(); } catch { /* Os nomes de gêneros serão omitidos em caso de falha. */ }
  await Promise.all([
    loadHero(),
    loadRow("popular", () => tmdb.popular()),
    loadRow("topRated", () => tmdb.topRated()),
    loadRow("upcoming", () => tmdb.upcoming()),
    loadRow("nowPlaying", () => tmdb.nowPlaying()),
  ]);
  setupInfiniteScroll();
}

init();
