import React from 'react';
import { Typography, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const Dashboard = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Dashboard - CMS Agustinos</Title>
        <Button onClick={handleLogout} type="default">
          Cerrar Sesión
        </Button>
      </div>
      
      <p>¡Bienvenido al CMS Agustinos, <strong>{user?.username}</strong>!</p>
      <p>Role: <strong>{user?.role}</strong></p>
      <p>Email: <strong>{user?.email}</strong></p>
      
      <div style={{ marginTop: '32px' }}>
        <Title level={3}>Próximas funcionalidades:</Title>
        <ul>
          <li>Gestión de artículos</li>
          <li>Upload de imágenes y videos</li>
          <li>Editor WYSIWYG</li>
          <li>Estadísticas</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;