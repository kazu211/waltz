import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import MonthlyListPage from './pages/MonthlyListPage';
import MonthlyChartPage from './pages/MonthlyChartPage';
import AnnualTrendPage from './pages/AnnualTrendPage';
import MonthComparePage from './pages/MonthComparePage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MonthlyChartPage />} />
          <Route path="monthly" element={<MonthlyListPage />} />
          <Route path="trend" element={<AnnualTrendPage />} />
          <Route path="compare" element={<MonthComparePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
