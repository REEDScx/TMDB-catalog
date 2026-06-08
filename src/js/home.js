import { askForApiKey, detailUrl, formatRating, formatYear, hasApiKey, imageUrl, imageSizes, loadGenres, tmdb, toggleFavorite } from "./api.js";
import { initSearch } from "./search.js";
import { movieCard } from "./ui.js";

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

function createSkeletons(container, count = 8) {
  container.innerHTML = Array.from({ length: count }, () => `<div class="skeleton skeleton-card"></div>`).join("");
}

function renderError(container, error) {
  container.innerHTML = `<div class="error-state">${error.message}<br><button class="btn" data-api-key-button>Configurar API Key</button></div>`;
}

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

async function loadHero() {
  const hero = document.querySelector("[data-hero]");
  try {
    const data = await tmdb.popular();
    const movie = (data.results || []).find((item) => item.backdrop_path) || data.results?.[0];
    if (!movie) return;
    hero.style.backgroundImage = `url(${imageUrl(movie.backdrop_path, imageSizes.backdrop)})`;
    hero.innerHTML = `
      <div class="hero__content">
        <p class="eyebrow">Destaque popular</p>
        <h1 class="hero__title">${movie.title}</h1>
        <div class="hero__meta"><span>${formatYear(movie.release_date)}</span><span class="rating">★ ${formatRating(movie.vote_average)}</span><span>Popular no TMDB</span></div>
        <div class="hero__stats" aria-label="Resumo do destaque">
          <span><strong>${formatRating(movie.vote_average)}</strong>Nota TMDB</span>
          <span><strong>${formatYear(movie.release_date)}</strong>Ano</span>
          <span><strong>4K</strong>Visual premium</span>
        </div>
        <p class="hero__overview">${movie.overview || "Sinopse indisponível para este título."}</p>
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

async function loadCatalog() {
  if (isLoadingCatalog || !hasMoreCatalog) return;
  isLoadingCatalog = true;
  try {
    const data = await tmdb.popular(catalogPage);
    await loadGenres();
    catalogGrid.insertAdjacentHTML("beforeend", (data.results || []).map(movieCard).join(""));
    pageIndicator.textContent = `Página ${catalogPage}`;
    catalogPage += 1;
    hasMoreCatalog = catalogPage <= Math.min(data.total_pages || 1, 20);
  } catch (error) {
    if (!catalogGrid.children.length) renderError(catalogGrid, error);
    hasMoreCatalog = false;
  } finally {
    isLoadingCatalog = false;
  }
}

function setupInfiniteScroll() {
  const sentinel = document.querySelector("[data-infinite-sentinel]");
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) loadCatalog();
  }, { rootMargin: "500px" });
  observer.observe(sentinel);
}

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
