import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Importar páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Articles from './pages/Articles';
import ArticleEditor from './pages/ArticleEditor'; // 👈 NUEVA IMPORTACIÓN

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
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
          
          {/* Rutas protegidas */}
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
          
          {/* 👈 NUEVAS RUTAS DEL EDITOR */}
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
          
          {/* Redirección por defecto */}
          <Route 
            path="/" 
            element={<Navigate to="/dashboard" />} 
          />
        </Routes>
      </div>
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