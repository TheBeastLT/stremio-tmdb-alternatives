const { MovieDb } = require('moviedb-promise')
const cinemeta = require('./cinemeta_client');

const tmdbClient = new MovieDb(process.env.TMDB_API_KEY);

async function getTmdbMetadata(series) {
  return cinemeta.getCinemetaMetadata(series)
      .then(metadata => getSeriesVideos(series)
          .then(videos => ({...metadata, videos })));
}

async function getSeriesVideos(series) {
  return tmdbClient.episodeGroup(series.episodeGroupId)
      .then(episodeGroup => episodeGroup.groups
          .map(group => group.episodes.map((episode, index) => ({
            id: `${series.imdbId}:${group.order}:${index + 1}`,
            title: episode.name,
            season: group.order,
            episode: index + 1,
            released: new Date(Date.parse(episode.air_date) + index),
            description: episode.overview,
          })))
          .reduce((a, b) => a.concat(b), []));
}

module.exports = { getTmdbMetadata }