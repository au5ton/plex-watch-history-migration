
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
  let res = await fetch(`/api/get_watched_movies?plex_token=${plex_token}&server_name=${server_name}&skip=${skip}&limit=${limit}`);
  return await res.json() as PaginatedResponseDTO<WatchedMovieDTO>;
}

export async function get_all_watched_movies(plex_token: string, server_name: string, chunkLimit: number = 50): Promise<WatchedMovieDTO[]> {
  let results: WatchedMovieDTO[] = []
  let last_res: PaginatedResponseDTO<WatchedMovieDTO>;
  let skip = 0;
  do {
    last_res = await get_watched_movies(plex_token, server_name, skip, chunkLimit);
    results = results.concat(last_res.watched)
    skip += last_res.watched.length;
  }
  while(last_res.watched.length > 0)
  return results;
}

export interface WatchedEpisodeDTO {
  grandparentTitle: string;
  grandparentGuid: string;
  parentIndex: number;
  index: number;
  formatted: string;
  guid: string;
}

export async function get_watched_tv(plex_token: string, server_name: string, skip: number = 0, limit: number = 10): Promise<PaginatedResponseDTO<WatchedEpisodeDTO>> {
  let res = await fetch(`/api/get_watched_tv?plex_token=${plex_token}&server_name=${server_name}&skip=${skip}&limit=${limit}`);
  return await res.json() as PaginatedResponseDTO<WatchedEpisodeDTO>;
}

export async function get_all_watched_tv(plex_token: string, server_name: string, chunkLimit: number = 50): Promise<WatchedEpisodeDTO[]> {
  let results: WatchedEpisodeDTO[] = []
  let last_res: PaginatedResponseDTO<WatchedEpisodeDTO>;
  let skip = 0;
  do {
    last_res = await get_watched_tv(plex_token, server_name, skip, chunkLimit);
    results = results.concat(last_res.watched)
    skip += last_res.watched.length;
  }
  while(last_res.watched.length > 0)
  return results;
}

export interface MoviePostRequestBodyDTO {
  movieTitle: string;
  movieGuid: String;
}

export interface GuidRatingKeyPairDTO {
  title: string;
  guid: string;
  ratingKey: string;
}

export async function get_movie_rating_key(plex_token: string, server_name: string, request: MoviePostRequestBodyDTO): Promise<GuidRatingKeyPairDTO> {
  let res = await fetch(`/api/get_movie_rating_key?plex_token=${plex_token}&server_name=${server_name}`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return await res.json() as GuidRatingKeyPairDTO;
}

export interface ShowPostRequestBodyDTO {
  grandparentTitle: string;
  grandparentGuid: string;
}

export async function get_show_rating_key(plex_token: string, server_name: string, request: ShowPostRequestBodyDTO): Promise<GuidRatingKeyPairDTO> {
  let res = await fetch(`/api/get_show_rating_key?plex_token=${plex_token}&server_name=${server_name}`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return await res.json() as GuidRatingKeyPairDTO;
}

export interface EpisodePostRequestBodyDTO {
  showRatingKey: number;
  showGuid: string;
  watchedEpisodes: string[];
}

export interface EpisodeGuidRatingKeyPairDTO {
  guid: string;
  ratingKey: number;
  forServer: string;
  formatted: string;
}

export async function get_episode_rating_keys(plex_token: string, server_name: string, request: EpisodePostRequestBodyDTO): Promise<EpisodeGuidRatingKeyPairDTO[]> {
  let res = await fetch(`/api/get_episode_rating_keys?plex_token=${plex_token}&server_name=${server_name}`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return await res.json() as EpisodeGuidRatingKeyPairDTO[];
}

export interface ScrobblePostRequestBodyDTO {
  ratingKeys: number[];
}

export async function scrobble(plex_token: string, server_name: string, request: ScrobblePostRequestBodyDTO): Promise<(number|string)[]> {
  let res = await fetch(`/api/scrobble?plex_token=${plex_token}&server_name=${server_name}`, {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return await res.json() as any;
}
