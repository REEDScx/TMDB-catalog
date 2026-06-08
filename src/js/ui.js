import { detailUrl, formatRating, formatYear, getGenreNames, imageUrl } from "./api.js";

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
