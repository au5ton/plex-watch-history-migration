import { gretch, GretchOptions } from 'gretchen'
// Delay are exponential: 40ms, 1_600ms, 64_000ms
const options: Partial<GretchOptions> = {
  retry: {
    attempts: 5, // was 3
    methods: ['GET', 'POST'],
    delay: 15 // was 40
  },
  timeout: 20000
};

export interface PlexServerDTO {
  name: string;
  server_uri_jws: string;
  server_token: string;
}

export interface UserDTO {
  username: string;
  email: string;
  uuid: string;
}

export interface PaginatedResponseDTO<T> {
  watched: T[];
  totalSize: number;
}

export interface WatchedMovieDTO {
  title: string;
  guid: string;
}

export async function get_watched_movies(plex_token: string, server_jws: string, skip: number = 0, limit: number = 10): Promise<PaginatedResponseDTO<WatchedMovieDTO>> {
  let { data } = await gretch<PaginatedResponseDTO<WatchedMovieDTO>>(`/api/get_watched_movies?plex_token=${plex_token}&server_jws=${server_jws}&skip=${skip}&limit=${limit}`, options).json();
  return data as PaginatedResponseDTO<WatchedMovieDTO>;
}

// export async function get_all_watched_movies(plex_token: string, server_name: string, chunkLimit: number = 50): Promise<WatchedMovieDTO[]> {
//   let results: WatchedMovieDTO[] = []
//   let last_res: PaginatedResponseDTO<WatchedMovieDTO>;
//   let skip = 0;
//   do {
//     last_res = await get_watched_movies(plex_token, server_name, skip, chunkLimit);
//     results = results.concat(last_res.watched)
//     skip += last_res.watched.length;
//   }
//   while(last_res.watched.length > 0)
//   return results;
// }

export interface WatchedEpisodeDTO {
  grandparentTitle: string;
  grandparentGuid: string;
  parentIndex: number;
  index: number;
  formatted: string;
  guid: string;
}

export async function get_watched_tv(plex_token: string, server_jws: string, skip: number = 0, limit: number = 10): Promise<PaginatedResponseDTO<WatchedEpisodeDTO>> {
  let { data } = await gretch<PaginatedResponseDTO<WatchedEpisodeDTO>>(`/api/get_watched_tv?plex_token=${plex_token}&server_jws=${server_jws}&skip=${skip}&limit=${limit}`, options).json();
  return data as PaginatedResponseDTO<WatchedEpisodeDTO>;
}

// export async function get_all_watched_tv(plex_token: string, server_name: string, chunkLimit: number = 50): Promise<WatchedEpisodeDTO[]> {
//   let results: WatchedEpisodeDTO[] = []
//   let last_res: PaginatedResponseDTO<WatchedEpisodeDTO>;
//   let skip = 0;
//   do {
//     last_res = await get_watched_tv(plex_token, server_name, skip, chunkLimit);
//     results = results.concat(last_res.watched)
//     skip += last_res.watched.length;
//   }
//   while(last_res.watched.length > 0)
//   return results;
// }

export interface MoviePostRequestBodyDTO {
  movieTitle: string;
  movieGuid: String;
}

export interface GuidRatingKeyPairPrimitiveDTO {
  guid: string;
  ratingKey: number;
}

export interface GuidRatingKeyPairDTO extends GuidRatingKeyPairPrimitiveDTO {
  title: string;
}

export async function get_movie_rating_key(plex_token: string, server_jws: string, request: MoviePostRequestBodyDTO): Promise<GuidRatingKeyPairDTO | null | undefined> {
  let { data } = await gretch<GuidRatingKeyPairDTO>(`/api/get_movie_rating_key?plex_token=${plex_token}&server_jws=${server_jws}`, {
    method: 'POST',
    body: JSON.stringify(request),
    ...options
  }).json();
  return data;
}

export interface ShowPostRequestBodyDTO {
  grandparentTitle: string;
  grandparentGuid: string;
}

export async function get_show_rating_key(plex_token: string, server_jws: string, request: ShowPostRequestBodyDTO): Promise<GuidRatingKeyPairDTO | null | undefined> {
  let { data } = await gretch<GuidRatingKeyPairDTO>(`/api/get_show_rating_key?plex_token=${plex_token}&server_jws=${server_jws}`, {
    method: 'POST',
    body: JSON.stringify(request),
    ...options
  }).json();
  return data;
}

export interface EpisodePostRequestBodyDTO {
  showRatingKey: number;
  showGuid: string;
  watchedEpisodes: string[];
}

export interface EpisodeGuidRatingKeyPairDTO extends GuidRatingKeyPairPrimitiveDTO {
  formatted: string;
}

export async function get_episode_rating_keys(plex_token: string, server_jws: string, request: EpisodePostRequestBodyDTO): Promise<EpisodeGuidRatingKeyPairDTO[]> {
  let { data } = await gretch<EpisodeGuidRatingKeyPairDTO[]>(`/api/get_episode_rating_keys?plex_token=${plex_token}&server_jws=${server_jws}`, {
    method: 'POST',
    body: JSON.stringify(request),
    ...options
  }).json();
  return Array.isArray(data) ? data: [];
}

export interface ScrobblePostRequestBodyDTO {
  ratingKeys: number[];
}

export async function scrobble(plex_token: string, server_jws: string, request: ScrobblePostRequestBodyDTO): Promise<(number|string)[]> {
  let { data } = await gretch<Array<number|string>>(`/api/scrobble?plex_token=${plex_token}&server_jws=${server_jws}`, {
    method: 'POST',
    body: JSON.stringify(request),
    ...options
  }).json();
  return Array.isArray(data) ? data : [];
}

export interface OnDeckShowDTO {
  grandparentTitle: string;
  grandparentGuid: string;
  episodeRatingKey: number; // ratingKey of the episode that appeared in the hub
}

export async function get_continue_watching(plex_token: string, server_jws: string): Promise<OnDeckShowDTO[]> {
  let { data } = await gretch<OnDeckShowDTO[]>(`/api/get_continue_watching?plex_token=${plex_token}&server_jws=${server_jws}`, options).json();
  return Array.isArray(data) ? data : [];
}

// will return "200" for a successful remove and "404" for an invalid rating_key
export async function remove_from_continue_watching(plex_token: string, server_jws: string, rating_key: number): Promise<string | undefined> {
  let { data } = await gretch<string>(`/api/remove_from_continue_watching?plex_token=${plex_token}&server_jws=${server_jws}&rating_key=${rating_key}`, options).json();
  return data;
}

export async function get_show_episodes(plex_token: string, server_jws: string, rating_key: string): Promise<WatchedEpisodeDTO[]> {
  let { data } = await gretch<WatchedEpisodeDTO[]>(`/api/get_show_episodes?plex_token=${plex_token}&server_jws=${server_jws}&rating_key=${rating_key}`, options).json();
  return Array.isArray(data) ? data : [];
}
