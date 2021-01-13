const needle = require('needle');

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';
const DEFAULT_TIMEOUT = 60000; // 60s

function getCinemetaCatalogMetadata(series) {
  return getCinemetaMetadata(series)
      .then(meta => ({
        id: meta.id,
        imdb_id: meta.imdb_id,
        imdbRating: meta.imdbRating,
        name: meta.name,
        type: meta.type,
        description: meta.description,
        genres: meta.genres,
        released: meta.released,
        runtime: meta.runtime,
        director: meta.director,
        writer: meta.writer,
        cast: meta.cast,
        year: meta.year,
        releaseInfo: meta.releaseInfo,
        status: meta.status,
        logo: meta.logo,
        poster: meta.poster,
        background: meta.background,
        awards: meta.awards,
        popularity: meta.popularity,
      }));
}

function getCinemetaMetadata(series, type = 'series') {
  return _getCinemetaMetadata(series.imdbId, type)
      .then(metadata => ({...metadata, id: `tmdb:${series.tmdbId}`}));
}

function _getCinemetaMetadata(imdbId, type) {
  return needle('get', `${CINEMETA_URL}/meta/${type}/${imdbId}.json`, { open_timeout: DEFAULT_TIMEOUT })
      .then(response => {
        if (response.body && response.body.meta) {
          return response.body.meta;
        } else {
          throw new Error('No search results');
        }
      });
}

module.exports = { getCinemetaCatalogMetadata, getCinemetaMetadata };