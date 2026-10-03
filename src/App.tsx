import { Routes, Route } from 'react-router-dom'
import World from './pages/World'
import Country from './pages/Country'
import Landmark from './pages/Landmark'
import Nature from './pages/Nature'
import TimeTravel from './pages/TimeTravel'
import NotFound from './pages/NotFound'
import ExplorerLauncher from './components/ExplorerLauncher'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<World />} />
        <Route path="/world" element={<World />} />
        <Route path="/country/:cca3" element={<Country />} />
        <Route path="/landmark/:slug" element={<Landmark />} />
        <Route path="/nature/:slug" element={<Nature />} />
        <Route path="/time-travel" element={<TimeTravel />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ExplorerLauncher />
    </>
  )
}

export default App
