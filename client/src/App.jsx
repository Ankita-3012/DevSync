import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import NotFound from './pages/NotFound';
import Loader from './components/common/Loader';
import Dashboard from './pages/Dashboard';
import RoomPage from './pages/RoomPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader /></div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader /></div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupForm />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/room/:roomCode" element={<ProtectedRoute><RoomPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;