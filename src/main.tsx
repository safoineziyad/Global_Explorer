import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { I18nProvider } from './i18n'
import { ExplorerProvider } from './state/explorer'
import { initPwa, registerServiceWorker } from './services/pwa'
import './index.css'

// Capture `beforeinstallprompt` before the first render so an install prompt
// that Chrome fires early is not missed. No-ops without service-worker support.
initPwa()
registerServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <I18nProvider>
        <ExplorerProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
          </BrowserRouter>
        </ExplorerProvider>
      </I18nProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
