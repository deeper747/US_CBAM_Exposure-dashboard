import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'

const v = new URLSearchParams(location.search).get('v')
const appModule = v === '2' ? import('./V3App.jsx') : import('./V2App.jsx')

appModule.then(module => {
  const App = module.default
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {createElement(App)}
    </StrictMode>,
  )
})
