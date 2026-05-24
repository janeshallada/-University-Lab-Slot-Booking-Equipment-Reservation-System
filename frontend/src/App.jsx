import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Labs from './pages/Labs.jsx';
import Reserve from './pages/Reserve.jsx';
import History from './pages/History.jsx';
import AssistantDashboard from './pages/AssistantDashboard.jsx';
import Analytics from './pages/Analytics.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/labs" replace />} />
        <Route path="/labs" element={<ProtectedRoute><Labs /></ProtectedRoute>} />
        <Route path="/labs/:id/reserve" element={<ProtectedRoute roles={['student', 'admin']}><Reserve /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute roles={['student', 'admin', 'assistant']}><History /></ProtectedRoute>} />
        <Route path="/assistant" element={<ProtectedRoute roles={['assistant', 'admin']}><AssistantDashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute roles={['assistant', 'admin']}><Analytics /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />
        <Route path="*" element={<div className="p-8 text-center text-slate-500">Page not found.</div>} />
      </Routes>
    </div>
  );
}
