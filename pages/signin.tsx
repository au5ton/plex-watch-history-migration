import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { PlexOauth } from 'plex-oauth'
import { useLocalstorageState } from 'rooks'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import { clientInformation } from '../lib/shared'

const plexOauth = new PlexOauth(clientInformation);

export default function SignIn() {
  const router = useRouter()
  const [authToken, setAuthToken] = useLocalstorageState<string>("X_PLEX_TOKEN", "")
  const isSignedIn = authToken !== ""

  // When the user signs in successfully
  useEffect(() => {
    if(isSignedIn) {
      router.push('/')
    }
  }, [isSignedIn])

  // When the "sign in" button is pressed
  const handleClick = async () => {
    // open a popup and retain a reference to the popup
    const oauthWindow = window.open(window.location.toString(), "_blank",`toolbar=0,location=0,status=0,menubar=0,scrollbars=1,resizable=1,width=500,height=500`);

    try {
      // contact the Plex API and get a login URL
      const [hostedUILink, pinId] = await plexOauth.requestHostedLoginURL();
      // set the popup URL to the special URL
      oauthWindow?.location.replace(hostedUILink)
      // wait for authentication to succeed, poll every 2 seconds, for up to 60 seconds
      const authToken = await plexOauth.checkForAuthToken(pinId, 2000, 30);
      // close the popup
      oauthWindow?.close()
      // save the token
      if(authToken) setAuthToken(authToken)
    }
    catch(err) {
      oauthWindow?.close()
      console.warn(err)
    }
  }

  return (
    <div>
      <Head>
        <title>Sign In | {clientInformation.product}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Container maxWidth="xs">
          <Stack direction="column" spacing={2}>
            <h2>Authorization Required</h2>
            <p>You must sign into Plex before proceding.</p>
            <Button variant="contained" onClick={handleClick}>Sign in with Plex</Button>
          </Stack>
        </Container>
      </main>
    </div>
  )
}
