import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import DashboardPage from './pages/dashboard/DashboardPage'
import PortfolioPage from './pages/portfolio/PortfolioPage'
import OptimizationPage from './pages/optimization/OptimizationPage'
import RiskAnalysisPage from './pages/risk/RiskAnalysisPage'
import SentimentPage from './pages/sentiment/SentimentPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/optimization" element={<OptimizationPage />} />
          <Route path="/risk" element={<RiskAnalysisPage />} />
          <Route path="/sentiment" element={<SentimentPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App