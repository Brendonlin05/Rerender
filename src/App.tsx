import LandingPage from './LandingPage'
import MainPage from './MainPage'
import RotatePrompt from './RotatePrompt'

export default function App() {
  const path = window.location.pathname
  return (
    <RotatePrompt>
      {path === '/app' ? <MainPage /> : <LandingPage />}
    </RotatePrompt>
  )
}
