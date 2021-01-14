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
      .then(episodeGroups => episodeGroups.groups
          .map(group => group.episodes.map((episode, index) => ({
            id: series.watchOrderOnly
                ? `${series.imdbId}:${episode.season_number}:${episode.episode_number}`
                : `${series.imdbId}:${group.order}:${index + 1}`,
            title: episode.name,
            season: group.order,
            episode: index + 1,
            released: series.watchOrderOnly
                ? new Date(Date.parse(group.episodes[0].air_date) + index)
                : new Date(Date.parse(episode.air_date) + index),
            overview: episode.overview,
          })))
          .reduce((a, b) => a.concat(b), []));
}

module.exports = { getTmdbMetadata }