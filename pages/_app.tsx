import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/system'
import { createTheme } from '@mui/material/styles'
import { Header } from '../components/header'

import '../styles/new.css'

const theme = createTheme({
  palette: {
    primary: {
      main: '#e5a00d',
    },
  },
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Header />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
export default MyApp
