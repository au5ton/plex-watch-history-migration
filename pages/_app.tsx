import { useMemo } from 'react'
import type { AppProps } from 'next/app'
import { ThemeProvider } from '@mui/system'
import { createTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Header } from '../components/header'

import '../styles/new.css'


function useTheme() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: '#e5a00d',
          },
          mode: prefersDarkMode ? 'dark' : 'light'
        },
      }),
    [prefersDarkMode],
  );

  return theme;
}

function MyApp({ Component, pageProps }: AppProps) {
  const theme = useTheme();
  return (
    <ThemeProvider theme={theme}>
      <Header />
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
export default MyApp
