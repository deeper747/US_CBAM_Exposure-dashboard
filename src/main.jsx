import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import V2App from './V2App.jsx'

const v = new URLSearchParams(location.search).get('v')
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {v === '2' ? <V2App /> : <App />}
  </StrictMode>,
)
