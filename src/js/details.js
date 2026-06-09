import { formatRating, formatRuntime, formatYear, imageUrl, imageSizes, isFavorite, loadGenres, tmdb, toggleFavorite } from "./api.js";
import { initSearch } from "./search.js";
import { setupChrome } from "./chrome.js";
import { escapeHtml, movieCard } from "./ui.js";

const root = document.querySelector("[data-details-root]");
const movieId = new URLSearchParams(window.location.search).get("id");

// Reutiliza o mesmo card da home para manter as recomendações consistentes.
function renderRecommendations(movies) {
  if (!movies?.length) return `<p class="muted">Nenhuma recomendação encontrada.</p>`;
  return `<div class="movie-row">${movies.slice(0, 14).map(movieCard).join("")}</div>`;
}

// Limita o elenco para preservar performance e leitura em telas menores.
function renderCast(cast) {
  if (!cast?.length) return `<p class="muted">Elenco indisponível.</p>`;
  return `<div class="cast-row">${cast.slice(0, 18).map((person) => `
    <article class="cast-card">
      <img src="${imageUrl(person.profile_path, imageSizes.profile)}" alt="Foto de ${escapeHtml(person.name)}" loading="lazy">
      <div><strong>${escapeHtml(person.name)}</strong><span>${escapeHtml(person.character || "Personagem não informado")}</span></div>
    </article>
  `).join("")}</div>`;
}

// Prioriza trailers oficiais do YouTube; se não houver, usa o primeiro vídeo disponível.
function findTrailer(videos) {
  return videos?.find((video) => video.site === "YouTube" && video.type === "Trailer") || videos?.find((video) => video.site === "YouTube");
}

function shareMovie(movie) {
  const payload = { title: movie.title, text: `Confira ${movie.title} no CineStream`, url: window.location.href };
  if (navigator.share) return navigator.share(payload);
  return navigator.clipboard.writeText(window.location.href).then(() => alert("Link copiado para a área de transferência."));
}

/** Renderiza todos os blocos da página após carregar os dados principais em paralelo. */
function render(movie, credits, videos, recommendations) {
  const trailer = findTrailer(videos.results || []);
  const favorite = isFavorite(movie.id);
  const title = escapeHtml(movie.title || "Filme sem título");
  const originalTitle = escapeHtml(movie.original_title || movie.title || "—");
  const overview = escapeHtml(movie.overview || "Sinopse indisponível.");
  document.title = `${movie.title} | CineStream`;
  root.innerHTML = `
    <section class="details-hero" style="background-image: url('${imageUrl(movie.backdrop_path, imageSizes.backdrop)}')">
      <div class="details-layout">
        <img class="details-poster" src="${imageUrl(movie.poster_path)}" alt="Poster de ${title}">
        <div class="details-content">
          <p class="eyebrow">Experiência cinematográfica</p>
          <h1>${title}</h1>
          <p class="muted">Título original: ${originalTitle}</p>
          <div class="details-meta">
            <span class="pill">${formatYear(movie.release_date)}</span>
            <span class="pill">${formatRuntime(movie.runtime)}</span>
            <span class="pill pill--rating rating">★ ${formatRating(movie.vote_average)}</span>
            <span class="pill">${movie.status || "—"}</span>
          </div>
          <div class="details-meta">${(movie.genres || []).map((genre) => `<span class="pill">${escapeHtml(genre.name)}</span>`).join("")}</div>
          <p>${overview}</p>
          <div class="hero__stats details-stats" aria-label="Resumo do filme">
            <span><strong>${formatRating(movie.vote_average)}</strong>Nota TMDB</span>
            <span><strong>${formatRuntime(movie.runtime)}</strong>Duração</span>
            <span><strong>${movie.original_language?.toUpperCase() || "—"}</strong>Idioma</span>
          </div>
          <div class="details-actions">
            ${trailer ? `<a class="btn" href="#trailer">Ver Trailer</a>` : ""}
            <button class="btn btn--ghost" data-favorite>${favorite ? "✓ Remover dos Favoritos" : "+ Adicionar aos Favoritos"}</button>
            <button class="btn btn--ghost" data-share>Compartilhar</button>
          </div>
        </div>
      </div>
    </section>

    <section class="details-section">
      <p class="eyebrow">Informações</p>
      <h2>Dados principais</h2>
      <div class="details-grid">
        <div class="fact"><span>Data de lançamento</span><strong>${movie.release_date || "—"}</strong></div>
        <div class="fact"><span>Idioma original</span><strong>${movie.original_language?.toUpperCase() || "—"}</strong></div>
        <div class="fact"><span>Duração</span><strong>${formatRuntime(movie.runtime)}</strong></div>
        <div class="fact"><span>Nota TMDB</span><strong>${formatRating(movie.vote_average)}</strong></div>
      </div>
    </section>

    <section class="details-section">
      <p class="eyebrow">Sinopse</p>
      <h2>Descrição completa</h2>
      <p>${overview}</p>
    </section>

    <section class="details-section">
      <p class="eyebrow">Créditos</p>
      <h2>Elenco</h2>
      ${renderCast(credits.cast || [])}
    </section>

    <section id="trailer" class="details-section">
      <p class="eyebrow">Vídeo</p>
      <h2>Trailer</h2>
      ${trailer ? `<iframe class="trailer-frame" src="https://www.youtube.com/embed/${encodeURIComponent(trailer.key)}" title="Trailer de ${title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>` : `<p class="muted">Trailer indisponível.</p>`}
    </section>

    <section class="details-section">
      <p class="eyebrow">Descubra mais</p>
      <h2>Recomendações</h2>
      ${renderRecommendations(recommendations.results || [])}
    </section>
  `;

  root.querySelector("[data-favorite]").addEventListener("click", (event) => {
    const added = toggleFavorite(movie);
    event.currentTarget.textContent = added ? "✓ Remover dos Favoritos" : "+ Adicionar aos Favoritos";
  });
  root.querySelector("[data-share]").addEventListener("click", () => shareMovie(movie));
}

async function init() {
  setupChrome();
  initSearch();
  if (!movieId) {
    root.innerHTML = `<section class="details-section"><div class="error-state">Filme não informado.</div></section>`;
    return;
  }
  try {
    await loadGenres();
    const [movie, credits, videos, recommendations] = await Promise.all([
      tmdb.movie(movieId),
      tmdb.credits(movieId),
      tmdb.videos(movieId),
      tmdb.recommendations(movieId),
    ]);
    render(movie, credits, videos, recommendations);
  } catch (error) {
    root.innerHTML = `<section class="details-section"><div class="error-state">${error.message}<br><button class="btn" data-api-key-button>Configurar API Key</button></div></section>`;
  }
}

init();
