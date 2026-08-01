import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: ReactNode, requireAdmin?: boolean }) => {
  const { user, userData, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050508] text-blue-500">Loading...</div>;
  if (!user || !userData) return <Navigate to="/" />;
  if (requireAdmin && !userData.isAdmin) return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Router>
            <div className="min-h-screen w-full bg-[#050508] text-gray-100 flex flex-col font-sans relative px-4 md:px-8 py-4">
              <div className="flex-1 flex flex-col w-full h-full">
                <Navbar />
                <main className="flex-grow relative z-10 pt-2 md:pt-4 w-full max-w-7xl mx-auto pb-16 md:pb-0">
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
            
            {/* Background cinematic effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600 opacity-10 blur-[120px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600 opacity-10 blur-[100px]" />
            </div>
          </div>
        </Router>
      </AuthProvider>
    </I18nProvider>
  );
}
