import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import LinkIcon from '@mui/icons-material/Link'
import { useTheme } from '@mui/system'
import { clientInformation } from '../lib/shared'

export function Header() {
  const theme = useTheme()
  return (
    <header>
      <Container maxWidth="lg">
        <h1 style={{ color: theme.palette.primary.main }}>{clientInformation.product}</h1>
        <Button href="https://github.com/au5ton/plex-watch-history-migration" variant="contained" size="small" startIcon={<LinkIcon />} sx={{ mt: 1 }}>
          Source Code
        </Button>
      </Container>
    </header>
  )
}