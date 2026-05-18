import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/design-system.css'   // tokens — must load first
import './index.css'                   // resets + atomic components
import './styles/vibrant-bg.css'       // shared <VibrantBg /> wallpaper styles
import App from './App'
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
