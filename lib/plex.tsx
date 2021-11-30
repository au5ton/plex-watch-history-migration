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

export async function get_watched_movies(plex_token: string, server_name: string, skip: number = 0, limit: number = 10): Promise<PaginatedResponseDTO<WatchedMovieDTO>> {
  let { data } = await gretch<PaginatedResponseDTO<WatchedMovieDTO>>(`/api/get_watched_movies?plex_token=${plex_token}&server_name=${server_name}&skip=${skip}&limit=${limit}`, options).json();
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

export async function get_watched_tv(plex_token: string, server_name: string, skip: number = 0, limit: number = 10): Promise<PaginatedResponseDTO<WatchedEpisodeDTO>> {
  let { data } = await gretch<PaginatedResponseDTO<WatchedEpisodeDTO>>(`/api/get_watched_tv?plex_token=${plex_token}&server_name=${server_name}&skip=${skip}&limit=${limit}`, options).json();
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

export async function get_movie_rating_key(plex_token: string, server_name: string, request: MoviePostRequestBodyDTO): Promise<GuidRatingKeyPairDTO | null | undefined> {
  let { data } = await gretch<GuidRatingKeyPairDTO>(`/api/get_movie_rating_key?plex_token=${plex_token}&server_name=${server_name}`, {
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

export async function get_show_rating_key(plex_token: string, server_name: string, request: ShowPostRequestBodyDTO): Promise<GuidRatingKeyPairDTO | null | undefined> {
  let { data } = await gretch<GuidRatingKeyPairDTO>(`/api/get_show_rating_key?plex_token=${plex_token}&server_name=${server_name}`, {
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
  forServer: string;
  formatted: string;
}

export async function get_episode_rating_keys(plex_token: string, server_name: string, request: EpisodePostRequestBodyDTO): Promise<EpisodeGuidRatingKeyPairDTO[]> {
  let { data } = await gretch<EpisodeGuidRatingKeyPairDTO[]>(`/api/get_episode_rating_keys?plex_token=${plex_token}&server_name=${server_name}`, {
    method: 'POST',
    body: JSON.stringify(request),
    ...options
  }).json();
  return Array.isArray(data) ? data: [];
}

export interface ScrobblePostRequestBodyDTO {
  ratingKeys: number[];
}

export async function scrobble(plex_token: string, server_name: string, request: ScrobblePostRequestBodyDTO): Promise<(number|string)[]> {
  let { data } = await gretch<Array<number|string>>(`/api/scrobble?plex_token=${plex_token}&server_name=${server_name}`, {
    method: 'POST',
    body: JSON.stringify(request),
    ...options
  }).json();
  return Array.isArray(data) ? data : [];
}
