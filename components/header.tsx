import Container from '@mui/material/Container'
import { useTheme } from '@mui/system'
import { clientInformation } from '../lib/shared'

export function Header() {
  const theme = useTheme()
  return (
    <header>
      <Container maxWidth="lg">
        <h1 style={{ color: theme.palette.primary.main }}>{clientInformation.product}</h1>
      </Container>
    </header>
  )
}