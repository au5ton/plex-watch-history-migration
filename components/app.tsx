import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useLocalstorageState } from 'rooks'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import { fetcher } from '../lib/shared'
import * as plex from '../lib/plex'
import { LinearProgressWithLabel } from './progress'
import { AsyncSemaphore } from '../lib/AsyncSemaphore'

// when running "npm run dev", the python functions don't execute, so we have to use prod when developing locally
// EDIT: Not actually necessary, just use "vercel dev" instead of "yarn dev"
//const BASE_URL = environment === 'development' ? 'https://plex-watch-history-migration-au5ton.vercel.app' : ''

export function Application() {
  const router = useRouter()
  const [authToken, setAuthToken] = useLocalstorageState<string>('X_PLEX_TOKEN', '')
  const isSignedIn = authToken !== ''
  const { data: user } = useSWR<plex.UserDTO, any>(`/api/whoami?plex_token=${authToken}`, fetcher)
  const { data: servers } = useSWR<string[], any>(`/api/list_servers?plex_token=${authToken}`, fetcher)

  const steps = ['Select servers to migrate to/from', 'Download watch history from old server', 'Connect references to new server', 'Mark as watched on new server'];
  const [activeStep, setActiveStep] = useState(0)
  const [nextButtonLocked, setNextButtonLocked] = useState(true)

  // step 1
  const [sourceServerName, setSourceServerName] = useState('') // default: ''
  const [destinationServerName, setDestinationServerName] = useState('') // default: ''
  // step 2
  const [step2ButtonLocked, setStep2ButtonLocked] = useState(false)
  const [sourceMovieHistory, setSourceMovieHistory] = useState<plex.WatchedMovieDTO[]>([]);
  const [sourceShowHistory, setSourceShowHistory] = useState<plex.WatchedEpisodeDTO[]>([]);
  const [sourceMovieHistoryTotalSize, setSourceMovieHistoryTotalSize] = useState(0);
  const [sourceShowHistoryTotalSize, setSourceShowHistoryTotalSize] = useState(0);
  // step 3
  const [step3ButtonLocked, setStep3ButtonLocked] = useState(false)
  const [scrobbles, setScrobbles] = useState<number[]>([])
  const [step3Done, setStep3Done] = useState(false)


  const handleSignOut = () => {
    setAuthToken('')
    router.reload()
  }

  const handleStep2 = async () => {
    // prevent spam
    setStep2ButtonLocked(true)

    // get+set totals
    setSourceMovieHistoryTotalSize((await plex.get_watched_movies(authToken, sourceServerName, 0, 2)).totalSize);
    setSourceShowHistoryTotalSize((await plex.get_watched_tv(authToken, sourceServerName, 0, 2)).totalSize);

    // download movies
    await (async () => {
      let last_res: plex.PaginatedResponseDTO<plex.WatchedMovieDTO>;
      let skip = 0;
      const chunkLimit = 100; // TODO: make more user controlled
      do {
        last_res = await plex.get_watched_movies(authToken, sourceServerName, skip, chunkLimit);
        setSourceMovieHistory(prev => [...prev, ...last_res.watched])
        skip += last_res.watched.length;
      }
      while(last_res.watched.length > 0)
    })();

    // download shows
    await (async () => {
      let last_res: plex.PaginatedResponseDTO<plex.WatchedEpisodeDTO>;
      let skip = 0;
      const chunkLimit = 100; // TODO: make more user controlled
      do {
        last_res = await plex.get_watched_tv(authToken, sourceServerName, skip, chunkLimit);
        setSourceShowHistory(prev => [...prev, ...last_res.watched])
        skip += last_res.watched.length;
      }
      while(last_res.watched.length > 0)
    })();

    setNextButtonLocked(false)
  }

  const handleStep3 = async () => {
    console.log('step 3 start')
    // prevent spam
    setStep3ButtonLocked(true)

    console.log('movie matching start')
    // get rating keys for movies
    const semaphore = new AsyncSemaphore(3);
    for(let movie of sourceMovieHistory) {
      await semaphore.withLockRunAndForget(async () => {
        const res = await plex.get_movie_rating_key(authToken, destinationServerName, {
          movieTitle: movie.title,
          movieGuid: movie.guid,
        })
  
        if(res) {
          setScrobbles(prev => [...prev, res.ratingKey])
        }
      })
    }
    
    console.log('movie matching end')

    console.log('show matching start')
    // reshape data to get list of unique shows
    const unique_shows = Array
      // unique show guids
      .from(new Set(sourceShowHistory.map(e => e.grandparentGuid)))
      // show guids + titles
      .map(grandparentGuid => {
        const { grandparentTitle } = (sourceShowHistory.find(e => e.grandparentGuid === grandparentGuid) as plex.WatchedEpisodeDTO);
        return ({ grandparentTitle, grandparentGuid }) as plex.ShowPostRequestBodyDTO
      });
    
    // get rating keys for shows, for querying individual episodes
    for(let show of unique_shows) {
      await semaphore.withLockRunAndForget(async () => {
        const res = await plex.get_show_rating_key(authToken, destinationServerName, show)

        if(res) {
          const showRatingKey = res.ratingKey

          // get episode guids for this show
          const watchedEpisodes = sourceShowHistory
            .filter(e => e.grandparentGuid === show.grandparentGuid)
            .map(e => e.guid);
          
          const res2 = await plex.get_episode_rating_keys(authToken, destinationServerName, {
            showRatingKey,
            showGuid: show.grandparentGuid,
            watchedEpisodes,
          });

          setScrobbles(prev => [...prev, ...res2.map(e => e.ratingKey)])
        }
      })
    }
    console.log('show matching end')
    
    // final indicators
    await semaphore.awaitTerminate();
    console.log('step 3 end')
    setStep3Done(true)
    setNextButtonLocked(false)
  }

  // Input validation
  useEffect(() => {
    if(activeStep === 0) {
      setNextButtonLocked(!(sourceServerName !== "" && destinationServerName !== ""))
    }
  }, [activeStep, sourceServerName, destinationServerName])

  const handleNextStep = () => {
    setNextButtonLocked(true)
    setActiveStep(prev => prev + 1)
  }

  const step1Content = (
    <Box sx={{ display: 'block' }} m={1}>
      <InputLabel id="sourceServerName">
        Source server
      </InputLabel>
      <Select
        labelId="sourceServerName"
        value={sourceServerName}
        onChange={e => setSourceServerName(e.target.value)}
        displayEmpty
      >
        <MenuItem value="">
          ---
        </MenuItem>
        {servers?.map(e => 
          <MenuItem key={e} value={e}>
            {e}
          </MenuItem>
        )}
      </Select>

      <InputLabel id="destinationServerName">
        Destination server
      </InputLabel>
      <Select
        labelId="destinationServerName"
        value={destinationServerName}
        onChange={e => setDestinationServerName(e.target.value)}
        displayEmpty
      >
        <MenuItem value="">
          ---
        </MenuItem>
        {servers?.map(e => 
          <MenuItem key={e} value={e}>
            {e}
          </MenuItem>
        )}
      </Select>
    </Box>
  )

  const step2Content = (
    <Box sx={{ display: 'block' }}>
      <Box sx={{ display: 'block', maxWidth: 600 }}>
        <InputLabel id="downloadMovieHistory">
          Downloading Movie watch history ({sourceMovieHistoryTotalSize === 0 ? '???' : sourceMovieHistoryTotalSize} movies)
        </InputLabel>
        <LinearProgressWithLabel aria-describedby="downloadMovieHistory" variant="determinate" value={sourceMovieHistory.length/sourceMovieHistoryTotalSize*100} />
      </Box>

      <Box sx={{ display: 'block', maxWidth: 600 }}>
        <InputLabel id="downloadShowHistory">
          Downloading TV watch history ({sourceShowHistoryTotalSize === 0 ? '???' : sourceShowHistoryTotalSize} episodes)
        </InputLabel>
        <LinearProgressWithLabel aria-describedby="downloadShowHistory" variant="determinate" value={sourceShowHistory.length/sourceShowHistoryTotalSize*100} />
      </Box>

      <Button variant="contained" size="small" onClick={handleStep2} disabled={step2ButtonLocked}>Start Download</Button>
    </Box>
  )

  const step3Content = (
    <Box sx={{ display: 'block' }}>
      <Box sx={{ display: 'block', maxWidth: 600 }}>
        <InputLabel id="matchContentHistory">
          Matching content across servers...
        </InputLabel>
        <LinearProgressWithLabel aria-describedby="matchContentHistory" variant="determinate" value={scrobbles.length/(sourceMovieHistoryTotalSize+sourceShowHistoryTotalSize)*100} />
      </Box>

      {
        step3Done && scrobbles.length === (sourceMovieHistoryTotalSize+sourceShowHistoryTotalSize) ? 
        <Alert severity="success">All movies and episodes matched!</Alert>
        :
        null
      }
      {
        step3Done && scrobbles.length !== (sourceMovieHistoryTotalSize+sourceShowHistoryTotalSize) ? 
        <Alert severity="warning">Some movies and/or episodes did not match.</Alert>
        :
        null
      }
      <Button variant="contained" size="small" onClick={handleStep3} disabled={step3ButtonLocked}>Start Matching</Button>
    </Box>
  )

  return (
    <>
    <p>
      Signed in as: <code>{user?.username}</code> or <code>{user?.email}</code>.
    </p>
    <p>
    <Button variant="contained" size="small" onClick={handleSignOut} disabled={activeStep > 0}>Sign Out</Button>
    </p>
    
    {/* Stepper indicator */}
    <Stepper activeStep={activeStep} orientation="vertical">
      {steps.map((label, index) => {
        return (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
            <StepContent>
              { index === 0 ? step1Content : null }
              { index === 1 ? step2Content : null }
              { index === 2 ? step3Content : null }
            </StepContent>
          </Step>
        );
      })}
    </Stepper>

    {/* Stepper controls */}
    <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
      {/* <Button
        color="inherit"
        disabled={activeStep === 0}
        sx={{ mr: 1 }}
      >
        Back
      </Button> */}
      <Box sx={{ flex: '1 1 auto' }} />
      <Button onClick={handleNextStep} disabled={nextButtonLocked}>
        {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
      </Button>
    </Box>
    </>
  )
}