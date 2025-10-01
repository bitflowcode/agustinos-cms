import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';
import './styles/custom.css';

// Importar páginas existentes
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleEditor from './pages/ArticleEditor';
import MiApp from './pages/MiApp';
import Trash from './pages/Trash';
import Users from './pages/Users';
import Profile from './pages/Profile';

// Importar nuevo layout
import AppLayout from './components/AppLayout';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para rutas solo de admin
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  
  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!isAdmin()) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// Componente para rutas públicas (solo para no autenticados)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando...</div>;
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function AppContent() {
  return (
    <Router>
      <AppLayout>
        <div className="App">
          <Routes>
            {/* Ruta de login */}
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            
            {/* Rutas protegidas existentes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/articles" 
              element={
                <ProtectedRoute>
                  <Articles />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/articles/new" 
              element={
                <ProtectedRoute>
                  <ArticleEditor />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/articles/edit/:id" 
              element={
                <ProtectedRoute>
                  <ArticleEditor />
                </ProtectedRoute>
              } 
            />
            
            {/* Nuevas rutas */}
            <Route 
              path="/mi-app" 
              element={
                <ProtectedRoute>
                  <MiApp />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/trash" 
              element={
                <ProtectedRoute>
                  <Trash />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/users" 
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirección por defecto */}
            <Route 
              path="/" 
              element={<Navigate to="/dashboard" />} 
            />
            
            {/* Catch-all para rutas no encontradas */}
            <Route 
              path="*" 
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </AppLayout>
    </Router>
  );
}

function App() {
  return (
    <ConfigProvider locale={esES}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;