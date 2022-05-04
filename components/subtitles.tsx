import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import useSWR from 'swr'
import { useLocalstorageState } from 'rooks'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import InputLabel from '@mui/material/InputLabel'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import StepContent from '@mui/material/StepContent'
import LogoutIcon from '@mui/icons-material/Logout'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import CheckIcon from '@mui/icons-material/Check'
import { useDropzone } from 'react-dropzone'
import { chunkArray, fetcher } from '../lib/shared'
import * as plex from '../lib/plex'
import { LinearProgressWithLabel } from './progress'
import { AsyncSemaphore } from '../lib/AsyncSemaphore'

export interface EpisodeSubtitlePair extends plex.WatchedEpisodeDTO {
  file?: File;
  uploaded?: boolean;
}

export function SubtitleApplication() {
  const router = useRouter()
  const [authToken, setAuthToken] = useLocalstorageState<string>('X_PLEX_TOKEN', '')
  const isSignedIn = authToken !== ''
  const { data: user } = useSWR<plex.UserDTO, any>(`/api/whoami?plex_token=${authToken}`, fetcher)
  const { data: servers } = useSWR<plex.PlexServerDTO[], any>(`/api/list_servers?plex_token=${authToken}`, fetcher)

  const handleDrop = (acceptedFiles: File[]) => {
    console.log(acceptedFiles)
    const data = acceptedFiles.map(file => {
      return {
        file,
        formatted: Array.from(file.name.matchAll(/S\d\dE\d\d/g)).flat(2)[0]
      }
    })

    for(let { file, formatted } of data) {
      const index = showEpisodes.findIndex(e => e.formatted.includes(formatted))
      if(index !== -1) {
        showEpisodes[index].file = file
        showEpisodes[index].uploaded = false
      }
    }

    setShowEpisodes(value => [...showEpisodes]);
  }

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({ onDrop: handleDrop });
  

  const steps = [
    'Select server to operate on',
    'Select show',
    'Connect references to new server',
    'Mark as watched on new server',
    `Clean up "Continue Watching" on new server`
  ];
  const [activeStep, setActiveStep] = useState(0)
  const [nextButtonLocked, setNextButtonLocked] = useState(true)

  // step 1
  const [serverName, setServerName] = useState('') // default: ''
  const [server, setServer] = useState<plex.PlexServerDTO>(undefined as any)
  // step 2
  const [step2ButtonLocked, setStep2ButtonLocked] = useState(false)
  const [showRatingKey, setShowRatingKey] = useState('33054') 
  const [showEpisodes, setShowEpisodes] = useState<EpisodeSubtitlePair[]>([])
  // step 3
  const [step3ButtonLocked, setStep3ButtonLocked] = useState(false)
  const [scrobbles, setScrobbles] = useState<number[]>([])
  const [step3Done, setStep3Done] = useState(false)
  // step 4
  const [step4ButtonLocked, setStep4ButtonLocked] = useState(false)
  const [completedScrobbles, setCompletedScrobbles] = useState(0)
  const [step4Done, setStep4Done] = useState(false)
  // step 5
  const [step5ButtonLocked, setStep5ButtonLocked] = useState(false)
  const [step5Done, setStep5Done] = useState(false)

  const handleSourceServerChange = (event: SelectChangeEvent<string>) => {
    setServerName(event.target.value)
    setServer(servers?.find(e => e.name === event.target.value) as any)
  }

  const handleSignOut = () => {
    setAuthToken('')
    router.reload()
  }

  const handleStep2 = async () => {
    // prevent spam
    setStep2ButtonLocked(true)

    // download shows
    await (async () => {
      const data = await plex.get_show_episodes(server.server_token, server.server_uri_jws, showRatingKey)
      setShowEpisodes(value => [...data]);
      console.log('get_show_episdes',data);
    })();

    setNextButtonLocked(false)
  }

  const handleStep3 = async () => {
    // prevent spam
    setStep3ButtonLocked(true)

    // get rating keys for movies
    const semaphore = new AsyncSemaphore(2);
    // for(let movie of sourceMovieHistory) {
    //   await semaphore.withLockRunAndForget(async () => {
    //     const res = await plex.get_movie_rating_key(destinationServer.server_token, destinationServer.server_uri_jws, {
    //       movieTitle: movie.title,
    //       movieGuid: movie.guid,
    //     })
  
    //     if(res) {
    //       setScrobbles(prev => [...prev, res.ratingKey])
    //     }
    //   })
    // }
    
    // final indicators
    await semaphore.awaitTerminate();
    setStep3Done(true)
    setNextButtonLocked(false)
  }

  // const handleStep4 = async () => {
  //   // prevent spam
  //   setStep4ButtonLocked(true)

  //   // do the thing
  //   const chunkSize = 5;
  //   const chunkCount = Math.floor(scrobbles.length / chunkSize)
  //   for(let chunk of chunkArray(scrobbles, chunkCount)) {
  //     const res = await plex.scrobble(destinationServer.server_token, destinationServer.server_uri_jws, {
  //       ratingKeys: chunk
  //     })
  //     // count the number of successes
  //     setCompletedScrobbles(prev => prev + res.filter(e => typeof e === 'number' && e >= 200 && e <= 299).length)
  //   }

  //   // final indicators
  //   setStep4Done(true)
  //   setNextButtonLocked(false)
  // }

  // const handleStep5 = async () => {
  //   // prevent spam
  //   setStep5ButtonLocked(true)

  //   // get source "on deck"
  //   const sourceDeck = await plex.get_continue_watching(sourceServer.server_token, sourceServer.server_uri_jws);
  //   // get destination "on deck"
  //   const destDeck = await plex.get_continue_watching(destinationServer.server_token, destinationServer.server_uri_jws);
  //   // calculate the rating keys to remove 
  //   const toRemove = destDeck
  //     // only the shows in the sourceDeck are allowed to stay in the destDeck,
  //     // so remove everything that isn't in the sourceDeck
  //     .filter(e => ! sourceDeck.map(e => e.grandparentGuid).includes(e.grandparentGuid))
  //     // we only want the rating keys in order to remove them
  //     .map(e => e.episodeRatingKey);

  //   for(let ratingKey of toRemove) {
  //     await plex.remove_from_continue_watching(destinationServer.server_token, destinationServer.server_uri_jws, ratingKey);
  //   }

  //   // final indicators
  //   setStep5Done(true)
  //   setNextButtonLocked(false)
  // }

  // Input validation
  useEffect(() => {
    if(activeStep === 0) {
      setNextButtonLocked(server !== undefined && !(serverName !== ""))
    }
  }, [activeStep, server])

  const handleNextStep = () => {
    setNextButtonLocked(true)
    setActiveStep(prev => prev + 1)
  }

  const step1Content = (
    <Box sx={{ display: 'block' }} m={1}>
      <InputLabel id="sourceServerName">
        Server
      </InputLabel>
      <Select
        labelId="sourceServerName"
        value={serverName}
        onChange={handleSourceServerChange}
        displayEmpty
      >
        <MenuItem value="">
          ---
        </MenuItem>
        {servers?.map(e => 
          <MenuItem key={e.name} value={e.name}>
            {e.name}
          </MenuItem>
        )}
      </Select>
    </Box>
  )

  const step2Content = (
    <Box sx={{ display: 'block' }}>
      <Stack
        direction="column"
        justifyContent="center"
        alignItems="flex-start"
        spacing={1}
        sx={{ maxWidth: 600 }}
      >
        <InputLabel>
          Enter show rating key:
        </InputLabel>
        <TextField label="Rating Key" variant="outlined" value={showRatingKey} onChange={e => setShowRatingKey(e.target.value)} />
        <Button variant="contained" size="small" onClick={handleStep2} disabled={step2ButtonLocked}>Start Download</Button>
      </Stack>
    </Box>
  )

  const step3Content = (
    <Box sx={{ display: 'block' }}>
      <div style={{ margin: '1rem', padding: '1rem', background: '#222', minHeight: '200px' }} {...getRootProps()}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <div>Drop the files here</div> :
            <div>Drag and drop some files here, or click to select files</div>
        }
      </div>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Episode</TableCell>
              <TableCell align="right">Subtitle File Given</TableCell>
              <TableCell align="right">Uploaded</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {showEpisodes.filter(row => row.file !== undefined).map(row => (
              <TableRow
                key={row.guid}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.formatted}
                </TableCell>
                <TableCell align="right">{row.file === undefined ? '' : '🟢'}</TableCell>
                <TableCell align="right">{row.uploaded === undefined ? '' : row.uploaded ? '🟢' : '🔴'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <br />
      <Button variant="contained" size="small" onClick={handleStep3} disabled={step3ButtonLocked}>Upload subtitles</Button>
    </Box>
  )

  // const step4Content = (
  //   <Box sx={{ display: 'block' }}>
  //     <Box sx={{ display: 'block', maxWidth: 600 }}>
  //       <InputLabel id="scrobbleProgress">
  //         Marking content...
  //       </InputLabel>
  //       <LinearProgressWithLabel aria-describedby="scrobbleProgress" variant="determinate" value={completedScrobbles/scrobbles.length*100} />
  //     </Box>

  //     {
  //       step4Done && completedScrobbles === scrobbles.length ? 
  //       <Alert severity="success">All matched content was marked! (Some may still be missing because it failed to match in Step 3)</Alert>
  //       :
  //       null
  //     }
  //     {
  //       step4Done && completedScrobbles !== scrobbles.length ? 
  //       <Alert severity="warning">Some matched content failed to be marked. (Even more may still be missing because it failed to match in Step 3)</Alert>
  //       :
  //       null
  //     }
  //     <Button variant="contained" size="small" onClick={handleStep4} disabled={step4ButtonLocked}>Start Marking</Button>
  //   </Box>
  // )

  // const step5Content = (
  //   <Box sx={{ display: 'block' }}>
  //     <Box sx={{ display: step5ButtonLocked ? 'block' : 'none', maxWidth: 600 }}>
  //       <InputLabel id="watchLaterPrune">
  //         Pruning extra content from "Continue Watching"...
  //       </InputLabel>
  //       { !step5Done ? <CircularProgress sx={{ m: 2 }} /> : null }
  //       { step5Done ? <Chip icon={<CheckIcon />} label="Pruning successful!" color="success" sx={{ mt: 2, mb: 2 }} /> : null }
  //     </Box>
  //     <Button variant="contained" size="small" onClick={handleStep5} disabled={step5ButtonLocked}>Start Pruning</Button>
  //   </Box>
  // )

  return (
    <>
    <Alert severity="warning" sx={{ mb: 2, maxWidth: 600 }}>
      <AlertTitle>Disclaimer</AlertTitle>
      This may not work perfectly.
      There are numerous factors and limitations that affect how this works, especially metadata differences between the two Plex servers.
      <strong>You may need to make manual corrections on your own, but hopefully this works well enough for most people!</strong>
    </Alert>
    <p>
      Signed in as: <code>{user?.username}</code> or <code>{user?.email}</code>.
    </p>
    <p>
    <Button variant="contained" size="small" onClick={handleSignOut} disabled={activeStep > 0} startIcon={<LogoutIcon />}>Sign Out</Button>
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
              {/* { index === 3 ? step4Content : null } */}
              {/* { index === 4 ? step5Content : null } */}
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