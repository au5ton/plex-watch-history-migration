import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import LinkIcon from '@mui/icons-material/Link'
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import SubtitlesIcon from '@mui/icons-material/Subtitles';
import { useTheme } from '@mui/system'
import { clientInformation } from '../lib/shared'

export function Header() {
  const theme = useTheme()
  return (
    <header>
      <Container maxWidth="lg">
        <h1 style={{ color: theme.palette.primary.main }}>{clientInformation.product}</h1>
        <Stack
          direction="row"
          justifyContent="flex-start"
          alignItems="center"
          spacing={1}
          sx={{ mt: 2 }}
        >
          <Button href="https://github.com/au5ton/plex-watch-history-migration" variant="contained" size="small" startIcon={<LinkIcon />}>
            Source Code
          </Button>
          <Button href="/" variant="contained" size="small" startIcon={<ManageHistoryIcon />} >
            Watch History Migration
          </Button>
          <Button href="/subtitles" variant="contained" size="small" startIcon={<SubtitlesIcon />} >
            Subtitles
          </Button>
        </Stack>
      </Container>
    </header>
  )
}