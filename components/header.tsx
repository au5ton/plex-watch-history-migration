import { Typography } from '@mui/material'
import { useTheme } from '@mui/system'
import { clientInformation } from '../lib/shared'

export function Header() {
  const theme = useTheme()
  return (
    <header>
      <h1 style={{ color: theme.palette.primary.main }}>{clientInformation.product}</h1>
    </header>
  )
}