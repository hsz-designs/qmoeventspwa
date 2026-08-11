import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { EventProvider } from './context/EventContext'
import { PwaInstallProvider } from './context/PwaInstallContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PwaInstallProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <EventProvider>
              <App />
            </EventProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </PwaInstallProvider>
  </StrictMode>,
)
