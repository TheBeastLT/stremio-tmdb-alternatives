const { addonBuilder } = require('stremio-addon-sdk');
const { cacheWrapMeta, cacheWrapCatalog } = require('./lib/cache');
const cinemeta = require('./lib/cinemeta_client')
const tmdb = require('./lib/tmdb_client')

const CACHE_MAX_AGE = process.env.CACHE_MAX_AGE || 7 * 24 * 60; // 7 days

const manifest = {
  id: 'community.tmdb.alternatives',
  version: '0.0.1',
  name: 'TMDB Alternatives',
  description: 'Provides a catalog for a few series (Netflix and similar) in alternative order.',
  logo: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg',
  resources: ['catalog', 'meta'],
  types: ['series'],
  idPrefixes: ['tmdb'],
  catalogs: [
    {
      id: 'tmdb-alternatives',
      name: 'TMDB Alternatives',
      type: 'series',
    }
  ],
};

const seriesData = [
  { imdbId: 'tt6468322', tmdbId: '71446', episodeGroupId: '5eb730dfca7ec6001f7beb51', name: "Money Heist" },
  { imdbId: 'tt7569592', tmdbId: '79242', episodeGroupId: '5ca7dd6f0e0a264c8bf0a62e', name: "Chilling Adventures of Sabrina" },
  { imdbId: 'tt2930604', tmdbId: '60554', episodeGroupId: '5b57d247c3a3685c85041004', name: "Star Wars Rebels" }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler((args) => {
  if (args.id !== manifest.catalogs[0].id) {
    return Promise.reject(`Unsupported catalog id: ${args.id}`);
  }

  return cacheWrapCatalog(args.id, () => getCatalogMetas())
      .then((metas) => ({ metas: metas, cacheMaxAge: CACHE_MAX_AGE }));
});

builder.defineMetaHandler((args) => {
  if (!args.id.match(/^tmdb:\d+$/)) {
    return Promise.reject(`Unsupported meta id: ${args.id}`);
  }
  const id = args.id.split(':')[1];
  const series = seriesData.find(data => data.tmdbId === id)
  if (!series) {
    return Promise.reject(`Unsupported meta: ${args.id}`);
  }

  return cacheWrapMeta(id, () => tmdb.getTmdbMetadata(series)
      .then((meta) => ({ meta: meta, cacheMaxAge: CACHE_MAX_AGE })));
});

async function getCatalogMetas() {
  return Promise.all(seriesData.map(series => cinemeta.getCinemetaCatalogMetadata(series)));
}

module.exports = builder.getInterface();