import { detailUrl, formatRating, formatYear, imageUrl, tmdb } from "./api.js";

const debounce = (callback, delay = 350) => {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => callback(...args), delay);
  };
};

export function initSearch() {
  const form = document.querySelector("[data-search-form]");
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  if (!form || !input || !results) return;

  const renderResults = (movies) => {
    if (!movies.length) {
      results.innerHTML = `<div class="empty-state">Nenhum filme encontrado.</div>`;
      results.classList.add("is-open");
      return;
    }

    results.innerHTML = movies.slice(0, 8).map((movie) => `
      <a class="search-result" href="${detailUrl(movie.id)}">
        <img src="${imageUrl(movie.poster_path, "w92")}" alt="Poster de ${movie.title}" loading="lazy">
        <span><strong>${movie.title}</strong><span>${formatYear(movie.release_date)}</span></span>
        <span class="rating">★ ${formatRating(movie.vote_average)}</span>
      </a>
    `).join("");
    results.classList.add("is-open");
  };

  const searchMovies = debounce(async () => {
    const query = input.value.trim();
    if (query.length < 2) {
      results.classList.remove("is-open");
      results.innerHTML = "";
      return;
    }

    results.innerHTML = `<div class="search-result"><span class="spinner"></span><span>Buscando...</span></div>`;
    results.classList.add("is-open");

    try {
      const data = await tmdb.search(query);
      renderResults(data.results || []);
    } catch (error) {
      results.innerHTML = `<div class="error-state">${error.message}</div>`;
    }
  });

  input.addEventListener("input", searchMovies);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const firstResult = results.querySelector("a");
    if (firstResult) window.location.href = firstResult.href;
  });
  document.addEventListener("click", (event) => {
    if (!form.contains(event.target)) results.classList.remove("is-open");
  });
}
