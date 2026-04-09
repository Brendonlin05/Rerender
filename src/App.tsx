import LandingPage from './LandingPage'
import MainPage from './MainPage'

export default function App() {
  const path = window.location.pathname
  if (path === '/app') return <MainPage />
  return <LandingPage />
}
