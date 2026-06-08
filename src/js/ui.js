import { detailUrl, formatRating, formatYear, getGenreNames, imageUrl } from "./api.js";

const ratingTone = (rating = 0) => {
  if (rating >= 7.5) return "Excelente";
  if (rating >= 6) return "Popular";
  return "Novo";
};

export function movieCard(movie) {
  const genres = getGenreNames(movie).slice(0, 2).join(" • ") || "Filme";
  const rating = formatRating(movie.vote_average);
  return `
    <article class="movie-card">
      <a class="movie-card__media" href="${detailUrl(movie.id)}" aria-label="Ver detalhes de ${movie.title}">
        <img class="movie-card__poster" src="${imageUrl(movie.poster_path)}" alt="Poster de ${movie.title}" loading="lazy">
        <span class="movie-card__shine" aria-hidden="true"></span>
      </a>
      <div class="movie-card__overlay">
        <span class="movie-card__badge">${ratingTone(movie.vote_average)}</span>
        <a class="btn btn--compact" href="${detailUrl(movie.id)}">Ver Detalhes</a>
      </div>
      <div class="movie-card__body">
        <h3 class="movie-card__title" title="${movie.title}">${movie.title}</h3>
        <div class="movie-card__meta"><span>${formatYear(movie.release_date)}</span><span class="rating">★ ${rating}</span></div>
        <span class="movie-card__genres">${genres}</span>
      </div>
    </article>
  `;
}
