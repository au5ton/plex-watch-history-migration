import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useLocalstorageState } from 'rooks'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import LinearProgress from '@mui/material/LinearProgress'
import { fetcher } from '../lib/shared'
import * as plex from '../lib/plex'
import { LinearProgressWithLabel } from './progress'

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
  const [activeStep, setActiveStep] = useState(1)
  const [nextButtonLocked, setNextButtonLocked] = useState(true)

  // step 1
  const [sourceServerName, setSourceServerName] = useState('mars') // default: ''
  const [destinationServerName, setDestinationServerName] = useState('jupiter') // default: ''
  // step 2
  const [step2ButtonLocked, setStep2ButtonLocked] = useState(false)
  const [sourceMovieHistory, setSourceMovieHistory] = useState<plex.WatchedMovieDTO[]>([]);
  const [sourceShowHistory, setSourceShowHistory] = useState<plex.WatchedEpisodeDTO[]>([]);
  const [sourceMovieHistoryTotalSize, setSourceMovieHistoryTotalSize] = useState(0);
  const [sourceShowHistoryTotalSize, setSourceShowHistoryTotalSize] = useState(0);

  const handleSignOut = () => {
    setAuthToken("")
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
      const chunkLimit = 200
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
      const chunkLimit = 200
      do {
        last_res = await plex.get_watched_tv(authToken, sourceServerName, skip, chunkLimit);
        setSourceShowHistory(prev => [...prev, ...last_res.watched])
        skip += last_res.watched.length;
      }
      while(last_res.watched.length > 0)
    })();

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
        <InputLabel id="downloadMovieHistory">
          Downloading TV watch history ({sourceShowHistoryTotalSize === 0 ? '???' : sourceShowHistoryTotalSize} episodes)
        </InputLabel>
        <LinearProgressWithLabel aria-describedby="downloadMovieHistory" variant="determinate" value={sourceShowHistory.length/sourceShowHistoryTotalSize*100} />
      </Box>

      <Button variant="contained" size="small" onClick={handleStep2} disabled={step2ButtonLocked}>Start Download</Button>
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