const API_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const API_KEY_STORAGE = "tmdb_api_key";
const FAVORITES_STORAGE = "cinestream_favorites";

export const imageSizes = {
  poster: "w500",
  backdrop: "w1280",
  profile: "w185",
};

export const genreMap = new Map();

/**
 * Lê a API Key da URL ou do LocalStorage.
 * A URL é útil para testar sem editar arquivos do projeto.
 */
export function getApiKey() {
  const params = new URLSearchParams(window.location.search);
  const keyFromUrl = params.get("api_key");
  if (keyFromUrl) {
    localStorage.setItem(API_KEY_STORAGE, keyFromUrl.trim());
    return keyFromUrl.trim();
  }
  return localStorage.getItem(API_KEY_STORAGE) || "";
}

export function askForApiKey() {
  const currentKey = getApiKey();
  const key = window.prompt("Informe sua API Key do TMDB. Ela será salva apenas no LocalStorage deste navegador.", currentKey);
  if (key !== null) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
    window.location.reload();
  }
}

export function hasApiKey() {
  return Boolean(getApiKey());
}

/**
 * Wrapper central do TMDB: adiciona API Key, idioma e mensagens de erro amigáveis.
 */
async function request(path, params = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Configure uma API Key do TMDB para carregar os filmes.");
  }

  const url = new URL(`${API_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", params.language || "pt-BR");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && key !== "language") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    const message = response.status === 401
      ? "API Key inválida ou sem permissão para acessar o TMDB."
      : `Erro ${response.status} ao consultar o TMDB.`;
    throw new Error(message);
  }
  return response.json();
}

export const tmdb = {
  popular: (page = 1) => request("/movie/popular", { page }),
  topRated: (page = 1) => request("/movie/top_rated", { page }),
  nowPlaying: (page = 1) => request("/movie/now_playing", { page }),
  upcoming: (page = 1) => request("/movie/upcoming", { page }),
  search: (query, page = 1) => request("/search/movie", { query, page, include_adult: false }),
  movie: (id) => request(`/movie/${id}`),
  credits: (id) => request(`/movie/${id}/credits`),
  videos: (id) => request(`/movie/${id}/videos`),
  recommendations: (id, page = 1) => request(`/movie/${id}/recommendations`, { page }),
  genres: () => request("/genre/movie/list"),
};

/** Carrega os gêneros uma única vez e mantém um cache em memória para os cards. */
export async function loadGenres() {
  if (genreMap.size) return genreMap;
  const data = await tmdb.genres();
  data.genres?.forEach((genre) => genreMap.set(genre.id, genre.name));
  return genreMap;
}

/** Retorna a imagem do TMDB ou o placeholder local quando não há poster/backdrop. */
export function imageUrl(path, size = imageSizes.poster) {
  if (!path) {
    return window.location.pathname.includes("/src/pages/") ? "../assets/images/placeholder.svg" : "src/assets/images/placeholder.svg";
  }
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function detailUrl(movieId) {
  const prefix = window.location.pathname.includes("/src/pages/") ? "movie.html" : "src/pages/movie.html";
  return `${prefix}?id=${movieId}`;
}

export function homeUrl() {
  return window.location.pathname.includes("/src/pages/") ? "../../index.html" : "index.html";
}

export function formatYear(date) {
  return date ? new Date(date).getFullYear() || "—" : "—";
}

export function formatRuntime(minutes) {
  if (!minutes) return "—";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${String(mins).padStart(2, "0")}min`;
}

export function formatRating(value) {
  return Number(value || 0).toFixed(1);
}

export function getGenreNames(movie, limit = 2) {
  const genres = movie.genres?.map((genre) => genre.name) || movie.genre_ids?.map((id) => genreMap.get(id)).filter(Boolean) || [];
  return genres.slice(0, limit);
}

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_STORAGE)) || [];
  } catch {
    return [];
  }
}

export function isFavorite(movieId) {
  return getFavorites().some((movie) => Number(movie.id) === Number(movieId));
}

/** Alterna o filme no LocalStorage e retorna true quando ele foi adicionado. */
export function toggleFavorite(movie) {
  const favorites = getFavorites();
  const exists = favorites.some((item) => Number(item.id) === Number(movie.id));
  const nextFavorites = exists
    ? favorites.filter((item) => Number(item.id) !== Number(movie.id))
    : [...favorites, normalizeFavorite(movie)];
  localStorage.setItem(FAVORITES_STORAGE, JSON.stringify(nextFavorites));
  return !exists;
}

function normalizeFavorite(movie) {
  return {
    id: movie.id,
    title: movie.title,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    poster_path: movie.poster_path,
    genre_ids: movie.genre_ids || movie.genres?.map((genre) => genre.id) || [],
  };
}
