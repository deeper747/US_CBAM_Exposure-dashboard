import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import V2App from './V2App.jsx'
import V3App from './V3App.jsx'

const v = new URLSearchParams(location.search).get('v')
createRoot(document.getElementById('root')).render(
  <StrictMode>
    {v === '2' ? <V2App /> : v === '3' ? <App /> : <V3App />}
  </StrictMode>,
)
