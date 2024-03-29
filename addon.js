const { addonBuilder } = require('stremio-addon-sdk');
const { cacheWrapMeta, cacheWrapCatalog } = require('./lib/cache');
const cinemeta = require('./lib/cinemeta_client')
const tmdb = require('./lib/tmdb_client')

const CACHE_MAX_AGE = process.env.CACHE_MAX_AGE || 24 * 60 * 60; // 24 hours
const STALE_REVALIDATE_AGE = 4 * 60 * 60; // 4 hours
const STALE_ERROR_AGE = 60 * 24 * 60 * 60; // 60 days

const manifest = {
  id: 'community.tmdb.alternatives',
  version: '0.0.3',
  name: 'TMDB Alternatives',
  description: 'Provides a catalog for a few series (Netflix and similar) in alternative order.',
  logo: 'https://i.imgur.com/D3zPfEq.png',
  resources: ['catalog', 'meta'],
  types: ['series'],
  idPrefixes: ['tmdba'],
  catalogs: [
    {
      id: 'tmdb-alternatives',
      name: 'TMDB Alternatives',
      type: 'series',
      extra: [{ name: 'search', isRequired: false }],
    }
  ],
};

const seriesData = [
  { imdbId: 'tt6468322', tmdbId: '71446', episodeGroupId: '5eb730dfca7ec6001f7beb51', name: "Money Heist" },
  { imdbId: 'tt7569592', tmdbId: '79242', episodeGroupId: '5ca7dd6f0e0a264c8bf0a62e', name: "Chilling Adventures of Sabrina" },
  { imdbId: 'tt5363918', tmdbId: '73021', episodeGroupId: '5d881805b76cbb0017e2c76a', name: "Disenchantment" },
  { imdbId: 'tt2531336', tmdbId: '96677', episodeGroupId: '6074e65418864b00439afa4f', name: "Lupin" },
  { imdbId: 'tt9153270', tmdbId: '87093', episodeGroupId: '5e9e34cdeec5b5001a40e71f', name: "Family Reunion" },
  { imdbId: 'tt10231312', tmdbId: '97727', episodeGroupId: '61737d25b5bc2100624237b7', name: "Inside Job" },
  { imdbId: 'tt2930604', tmdbId: '60554', episodeGroupId: '5b57d247c3a3685c85041004', name: "Star Wars Rebels" },
  { imdbId: 'tt0458290', tmdbId: '4194', episodeGroupId: '5b11ba820e0a265847002c6e', name: "Star Wars: The Clone Wars", watchOrderOnly: true }
];

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler((args) => {
  if (args.id !== manifest.catalogs[0].id) {
    return Promise.reject(`Unsupported catalog id: ${args.id}`);
  }

  if (args.extra && args.extra.search) {
    return tmdb.getSearchTmdbIds(args.extra.search, seriesData)
        .then(tmdbIds => cacheWrapCatalog(args.id, () => getCatalogMetas())
            .then(metas => metas.filter(meta => tmdbIds.includes(meta.id.split(':')[1]))))
        .then((metas) => ({ metas: metas, ...cacheVariables() }));
  }

  return cacheWrapCatalog(args.id, () => getCatalogMetas())
      .then((metas) => ({ metas: metas, ...cacheVariables() }));
});

builder.defineMetaHandler((args) => {
  if (!args.id.match(/^tmdba:\d+$/)) {
    return Promise.reject(`Unsupported meta id: ${args.id}`);
  }
  const id = args.id.split(':')[1];
  const series = seriesData.find(data => data.tmdbId === id)
  if (!series) {
    return Promise.reject(`Unsupported meta: ${args.id}`);
  }

  return cacheWrapMeta(id, () => tmdb.getTmdbMetadata(series)
      .then((meta) => ({ meta: meta, ...cacheVariables() })));
});

async function getCatalogMetas() {
  return Promise.all(seriesData.map(series => cinemeta.getCinemetaCatalogMetadata(series)));
}

function cacheVariables() {
  return { cacheMaxAge: CACHE_MAX_AGE, staleRevalidate: STALE_REVALIDATE_AGE, staleError: STALE_ERROR_AGE };
}

module.exports = builder.getInterface();