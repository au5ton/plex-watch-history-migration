import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { useLocalstorageState } from 'rooks'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import { fetcher } from '../lib/shared'
import * as plex from '../lib/plex'

// when running "npm run dev", the python functions don't execute, so we have to use prod when developing locally
// EDIT: Not actually necessary, just use "vercel dev" instead of "yarn dev"
//const BASE_URL = environment === 'development' ? 'https://plex-watch-history-migration-au5ton.vercel.app' : ''

export function Application() {
  const [authToken, _] = useLocalstorageState<string>('X_PLEX_TOKEN', '')
  const isSignedIn = authToken !== ''
  const { data: user } = useSWR<plex.UserDTO, any>(`/api/whoami?plex_token=${authToken}`, fetcher)
  const { data: servers } = useSWR<string[], any>(`/api/list_servers?plex_token=${authToken}`, fetcher)

  const steps = ['Select servers to migrate to/from', 'Download watch history from old server', 'Connect references to new server', 'Mark as watched on new server'];
  const [activeStep, setActiveStep] = useState(0)
  const [nextButtonLocked, setNextButtonLocked] = useState(true)

  const [sourceServerName, setSourceServerName] = useState('')
  const [destinationServerName, setDestinationServerName] = useState('')
  //console.log(data)

  const handleClick = async () => {
    if(isSignedIn) {
      console.log('click')
      //let data = await plex.get_all_watched_movies(authToken, 'mars');
      let data = await plex.get_all_watched_tv(authToken, 'mars');
      console.log(data)
    }
  }

  useEffect(() => {
    if(activeStep === 0) {
      setNextButtonLocked(!(sourceServerName !== "" && destinationServerName !== ""))
    }
  }, [activeStep, sourceServerName, destinationServerName])

  const handleNextStep = () => {
    setNextButtonLocked(true)
    setActiveStep(prev => prev + 1)
  }

  return (
    <>
    <p>Signed in as: <code>{user?.username}</code> or <code>{user?.email}</code></p>
    
    {/* Stepper indicator */}
    <Stepper activeStep={activeStep}>
      {steps.map((label, index) => {
        return (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        );
      })}
    </Stepper>

    {/* Stepper content */}
    <Box sx={{ display: activeStep === 0 ? 'block' : 'none'}} m={1}>
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