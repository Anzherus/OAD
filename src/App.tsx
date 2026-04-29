import { AppShell } from '@/ui/AppShell'
import { AboutMethods } from '@/ui/pages/AboutMethods'
import { OnchainAnalysis } from '@/ui/pages/OnchainAnalysis'
import { TraceImport } from '@/ui/pages/TraceImport'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<OnchainAnalysis />} />
          <Route path="/import" element={<TraceImport />} />
          <Route path="/about" element={<AboutMethods />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
