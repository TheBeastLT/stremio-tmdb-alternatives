const needle = require('needle');

const CINEMETA_URL = 'https://v3-cinemeta.strem.io';
const DEFAULT_TIMEOUT = 60000; // 60s

function getCinemetaCatalogMetadata(series) {
  return getCinemetaMetadata(series)
      .then(metadata => ({ ...metadata, videos: null }));
}

function getCinemetaMetadata(series, type = 'series') {
  return _getCinemetaMetadata(series.imdbId, type)
      .then(metadata => ({ ...metadata, id: `tmdba:${series.tmdbId}` }));
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