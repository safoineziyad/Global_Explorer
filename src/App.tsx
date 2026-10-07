import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import OfflineBanner from './components/OfflineBanner'
import PwaPrompt from './components/PwaPrompt'
import ExplorerLauncher from './components/ExplorerLauncher'
import Layout from './components/Layout'

const World = lazy(() => import('./pages/World'))
const Country = lazy(() => import('./pages/Country'))
const Landmark = lazy(() => import('./pages/Landmark'))
const Nature = lazy(() => import('./pages/Nature'))
const TimeTravel = lazy(() => import('./pages/TimeTravel'))
const Privacy = lazy(() => import('./pages/Privacy'))
const Terms = lazy(() => import('./pages/Terms'))
const Landing = lazy(() => import('./pages/Landing'))
const Directory = lazy(() => import('./pages/Directory'))
const NotFound = lazy(() => import('./pages/NotFound'))
const Error500 = lazy(() => import('./pages/Error500'))
const Maintenance = lazy(() => import('./pages/Maintenance'))

function App() {
  return (
    <ErrorBoundary>
      <OfflineBanner />
      <PwaPrompt />
      <Suspense fallback={<p className="route-loading" role="status">Loading page…</p>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/world" element={<World />} />
            <Route path="/directory" element={<Directory kind="countries" />} />
            <Route path="/landmarks" element={<Directory kind="landmarks" />} />
            <Route path="/nature" element={<Directory kind="nature" />} />
            <Route path="/country/:cca3" element={<Country />} />
            <Route path="/landmark/:slug" element={<Landmark />} />
            <Route path="/nature/:slug" element={<Nature />} />
            <Route path="/time-travel" element={<TimeTravel />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/500" element={<Error500 />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
      <ExplorerLauncher />
    </ErrorBoundary>
  )
}

export default App
