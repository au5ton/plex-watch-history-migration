import { useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import Container from '@mui/material/Container'
import { useLocalstorageState } from 'rooks'

import { clientInformation } from '../lib/shared'
import { SubtitleApplication } from '../components/subtitles'

export default function Home() {
  const router = useRouter()
  const [authToken, _] = useLocalstorageState<string>("X_PLEX_TOKEN", "")
  const isSignedIn = authToken !== ""

  useEffect(() => {
    if(!isSignedIn) {
      router.push('/signin')
    }
  }, [isSignedIn])

  return (
    <div>
      <Head>
        <title>{clientInformation.product}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxWidth="lg" >
      {
        isSignedIn ?
        <>
          <SubtitleApplication />
        </>
        :
        <>
          <p>You must sign into Plex before proceding. Redirecting...</p>
        </>
      }
      </Container>
    </div>
  )
}
