import { detailUrl, formatRating, formatYear, getGenreNames, imageUrl } from "./api.js";

/** Escapa textos vindos da API antes de inserir HTML com template strings. */
export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Badge curto para comunicar qualidade do filme sem poluir o card.
const ratingTone = (rating = 0) => {
  if (rating >= 7.5) return "Excelente";
  if (rating >= 6) return "Popular";
  return "Novo";
};

/**
 * Card reutilizável para home, favoritos e recomendações.
 * Mantém marcação e microinterações consistentes em todo o app.
 */
export function movieCard(movie) {
  const title = escapeHtml(movie.title || "Filme sem título");
  const genres = escapeHtml(getGenreNames(movie).slice(0, 2).join(" • ") || "Filme");
  const rating = formatRating(movie.vote_average);

  return `
    <article class="movie-card">
      <a class="movie-card__media" href="${detailUrl(movie.id)}" aria-label="Ver detalhes de ${title}">
        <img class="movie-card__poster" src="${imageUrl(movie.poster_path)}" alt="Poster de ${title}" loading="lazy">
        <span class="movie-card__shine" aria-hidden="true"></span>
      </a>
      <div class="movie-card__overlay">
        <span class="movie-card__badge">${ratingTone(movie.vote_average)}</span>
        <a class="btn btn--compact" href="${detailUrl(movie.id)}">Ver Detalhes</a>
      </div>
      <div class="movie-card__body">
        <h3 class="movie-card__title" title="${title}">${title}</h3>
        <div class="movie-card__meta"><span>${formatYear(movie.release_date)}</span><span class="rating">★ ${rating}</span></div>
export function movieCard(movie) {
  const genres = getGenreNames(movie).join(" • ") || "Filme";
  return `
    <article class="movie-card">
      <img class="movie-card__poster" src="${imageUrl(movie.poster_path)}" alt="Poster de ${movie.title}" loading="lazy">
      <div class="movie-card__overlay">
        <a class="btn" href="${detailUrl(movie.id)}">Ver Detalhes</a>
      </div>
      <div class="movie-card__body">
        <h3 class="movie-card__title" title="${movie.title}">${movie.title}</h3>
        <div class="movie-card__meta"><span>${formatYear(movie.release_date)}</span><span class="rating">★ ${formatRating(movie.vote_average)}</span></div>
        <span class="movie-card__genres">${genres}</span>
      </div>
    </article>
  `;
}
