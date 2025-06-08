import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import PortfolioPage from './pages/portfolio/PortfolioPage'
import OptimizationPage from './pages/optimization/OptimizationPage'
import RiskAnalysisPage from './pages/risk/RiskAnalysisPage'
import SentimentPage from './pages/sentiment/SentimentPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <PortfolioPage />
              </ProtectedRoute>
            } />
            <Route path="/optimization" element={
              <ProtectedRoute>
                <OptimizationPage />
              </ProtectedRoute>
            } />
            <Route path="/risk" element={
              <ProtectedRoute>
                <RiskAnalysisPage />
              </ProtectedRoute>
            } />
            <Route path="/sentiment" element={
              <ProtectedRoute>
                <SentimentPage />
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App