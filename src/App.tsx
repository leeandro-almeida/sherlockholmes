import { Navigate, Route, Routes } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import AdminRegister from './pages/AdminRegister';
import Lobby from './pages/Lobby';
import Login from './pages/Login';
import Room from './pages/Room';
import { session } from './lib/session';

function RequireAdmin({ children }: { children: JSX.Element }) {
  return session.getAdminToken() ? children : <Navigate to="/" replace />;
}

function RequirePlayer({ children }: { children: JSX.Element }) {
  return session.getPlayerToken() ? children : <Navigate to="/lobby" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin/register" element={<AdminRegister />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route
        path="/room"
        element={
          <RequirePlayer>
            <Room />
          </RequirePlayer>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
