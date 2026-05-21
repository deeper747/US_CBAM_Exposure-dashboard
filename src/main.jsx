import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ComextDataProvider } from './context/ComextDataContext.jsx'

const v = new URLSearchParams(location.search).get('v')
const appModule = v === '3' ? import('./V3App.jsx') : v === '2' ? import('./V2App.jsx') : import('./App.jsx')

appModule.then(module => {
  const App = module.default
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ComextDataProvider>
        {createElement(App)}
      </ComextDataProvider>
    </StrictMode>,
  )
})
