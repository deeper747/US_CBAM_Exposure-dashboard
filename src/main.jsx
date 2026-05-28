import { StrictMode, createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { ComextDataProvider } from './context/ComextDataContext.jsx'

const v = new URLSearchParams(location.search).get('v')

const [appModule, Provider] =
  v === '4' ? [import('./V4App.jsx'), ComextDataProvider]
  : v === '2' ? [import('./App.jsx'), ComextDataProvider]
  : [import('./V3App.jsx'), ComextDataProvider]

appModule.then(module => {
  const App = module.default
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Provider>
        {createElement(App)}
      </Provider>
    </StrictMode>,
  )
})
