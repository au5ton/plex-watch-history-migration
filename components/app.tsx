import useSWR from 'swr'
import { useLocalstorageState } from 'rooks'
import { environment, fetcher } from '../lib/shared'

// when running "npm run dev", the python functions don't execute, so we have to use prod when developing locally
// EDIT: Not actually necessary, just use "vercel dev" instead of "yarn dev"
//const BASE_URL = environment === 'development' ? 'https://plex-watch-history-migration-au5ton.vercel.app' : ''

export function Application() {
  const [authToken, _] = useLocalstorageState<string>("X_PLEX_TOKEN", "")
  const isSignedIn = authToken !== ""
  const { data, error } = useSWR(`/api/whoami?plex_token=${authToken}`, fetcher)
  console.log(data)

  return (
    <>
    <p>Hey cool, you're signed in</p>
    <pre>
      { error || !data || !isSignedIn ? 'N/A' : JSON.stringify(data, null, 2)}
    </pre>
    </>
  )
}