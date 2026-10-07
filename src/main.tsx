import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './update'
import { App } from './App'
import './styles.css'

// mobile browsers shift the page up to show the focused field above the keyboard
// and don't always shift it back; return it once nothing is focused anymore
document.addEventListener('focusout', () =>
  setTimeout(() => {
    const el = document.activeElement
    if (!el || el === document.body) window.scrollTo(0, 0)
  }, 100),
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
