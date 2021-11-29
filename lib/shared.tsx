import { IPlexClientDetails } from 'plex-oauth'

export const clientInformation: IPlexClientDetails = {
  clientIdentifier: 'io.github.au5ton.plex-watch-history-migration', // This is a unique identifier used to identify your app with Plex.
  product: 'Watch History Migration for Plex (au5ton)', // Name of your application
  device: 'browser', // The type of device your application is running on
  version: '1', // Version of your application
  forwardUrl: '', // Url to forward back to after signing in.
  platform: 'Web', // Optional - Platform your application runs on - Defaults to 'Web'
}

export const environment = process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development'

export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init)
  return res.json()
}

// See: https://stackoverflow.com/a/46122602
export function chunkArray<T>(arr: T[], n: number): T[][] {
  let chunkLength = Math.max(arr.length/n ,1);
  let chunks: T[][] = [];
  for (let i = 0; i < n; i++) {
    if(chunkLength*(i+1) <= arr.length) chunks.push(arr.slice(chunkLength*i, chunkLength*(i+1)));
  }
  return chunks; 
}