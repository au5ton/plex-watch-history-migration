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
import StepContent from '@mui/material/StepContent'
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
    <>
    <p>
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam non ante sed magna faucibus egestas id eget metus. Curabitur nec imperdiet leo. Morbi in odio purus. Fusce vel blandit libero. Aenean finibus pulvinar odio, nec condimentum turpis suscipit ac. Pellentesque facilisis iaculis nibh, quis vestibulum est sagittis ut. Vivamus placerat finibus mauris pulvinar pharetra. Vivamus volutpat arcu id nulla luctus, eget luctus enim feugiat. Nullam pharetra leo vel libero sagittis, nec posuere sapien ullamcorper. 
    </p>
    <p>
    Nullam ultricies sapien ligula, sed commodo elit interdum at. Maecenas consequat at diam vitae lacinia. Pellentesque aliquet cursus sem, eget aliquam sem consectetur ut. Etiam tristique neque rutrum odio aliquet tincidunt in non felis. Pellentesque lacinia augue ut vehicula semper. Nunc tempus est nec lectus pulvinar lacinia. Integer tempus quam eu est porttitor, eu interdum arcu mattis. Maecenas vel porta lorem, eu faucibus arcu. Fusce at condimentum odio, vel aliquam tortor.
    </p>
    <p>
    Donec euismod et augue a pellentesque. Duis non ultrices libero, et semper lectus. Mauris ullamcorper tortor in enim feugiat ultricies. Fusce dignissim elit quam, sit amet imperdiet magna pharetra nec. Nam cursus dictum purus sit amet tempus. Suspendisse id tincidunt lectus. Mauris consectetur felis at felis sagittis, in ultrices tellus feugiat. Suspendisse potenti. Aenean in leo risus. 
    </p>
    </>
  )

  return (
    <>
    <p>Signed in as: <code>{user?.username}</code> or <code>{user?.email}</code></p>
    
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