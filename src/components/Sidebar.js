// src/components/Sidebar.js
import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Avatar, Space, Divider } from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  DeleteOutlined,
  MobileOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  AppstoreOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import agustinosLogo from '../assets/logo-agustinos.png';

const { Sider } = Layout;
const { Text, Title } = Typography;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  // Construir menú dinámicamente según el rol
  const buildMenuItems = () => {
    const items = [
      {
        key: 'dashboard',
        icon: <AppstoreOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/dashboard')
      },
      {
        key: 'contenido',
        icon: <FileTextOutlined />,
        label: 'Contenido',
        children: [
          {
            key: 'articles',
            label: 'Lista de Contenido',
            onClick: () => navigate('/articles')
          },
          {
            key: 'new-article',
            label: 'Crear nuevo',
            onClick: () => navigate('/articles/new')
          },
          {
            key: 'trash',
            label: 'Papelera',
            onClick: () => navigate('/trash')
          }
        ]
      },
      {
        key: 'mi-app',
        icon: <MobileOutlined />,
        label: 'Mi app',
        onClick: () => navigate('/mi-app')
      }
    ];

    // Añadir menú de Usuarios solo si es admin
    if (isAdmin()) {
      items.push({
        key: 'usuarios',
        icon: <TeamOutlined />,
        label: 'Usuarios',
        onClick: () => navigate('/users')
      });
    }

    return items;
  };

  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path === '/dashboard') return ['dashboard'];
    if (path === '/articles') return ['articles'];
    if (path === '/articles/new') return ['new-article'];
    if (path.startsWith('/articles/edit/')) return ['articles'];
    if (path === '/trash') return ['trash'];
    if (path === '/mi-app') return ['mi-app'];
    if (path === '/users') return ['usuarios'];
    return [];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.includes('/articles') || path === '/trash') return ['contenido'];
    return [];
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={280}
      style={{
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        background: 'white',
        borderRight: '1px solid #f0f0f0',
        boxShadow: '2px 0 8px rgba(0,0,0,0.06)'
      }}
      trigger={null}
    >
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        padding: collapsed ? '16px 8px' : '24px 16px'
      }}>
        
        {/* Header con logo y toggle */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            {!collapsed && (
              <div style={{ textAlign: 'center', width: '100%' }}>
                <img 
                  src={agustinosLogo} 
                  alt="Agustinos" 
                  style={{ 
                    height: 50, 
                    width: 'auto',
                    maxWidth: '100%'
                  }} 
                />
              </div>
            )}
            
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 40,
                height: 40,
                marginLeft: collapsed ? 0 : 8
              }}
            />
          </div>
          
          {/* Info del usuario */}
          {!collapsed && (
            <div 
              onClick={() => navigate('/profile')}
              style={{ 
                background: '#f8f9fa', 
                padding: 16, 
                borderRadius: 8,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e9ecef'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#f8f9fa'}
            >
              <Avatar 
                size={48} 
                icon={<UserOutlined />} 
                style={{ 
                  backgroundColor: '#1890ff',
                  marginBottom: 8
                }}
              />
              <div>
                <Text strong style={{ display: 'block', fontSize: 16 }}>
                  {user?.username}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.role} • {user?.email}
                </Text>
              </div>
            </div>
          )}
          
          {collapsed && (
            <div 
              onClick={() => navigate('/profile')}
              style={{ textAlign: 'center', cursor: 'pointer' }}
            >
              <Avatar 
                size={40} 
                icon={<UserOutlined />} 
                style={{ backgroundColor: '#1890ff' }}
              />
            </div>
          )}
        </div>

        {/* Menú principal - dinámico según rol */}
        <div style={{ flex: 1 }}>
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            defaultOpenKeys={getOpenKeys()}
            items={buildMenuItems()}
            style={{ 
              border: 'none',
              fontSize: '14px'
            }}
            inlineIndent={16}
          />
        </div>

        {/* Botón de cerrar sesión */}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <Divider style={{ margin: '16px 0' }} />
          <Button
            danger
            block={!collapsed}
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{
              height: 40,
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {!collapsed && 'Cerrar Sesión'}
          </Button>
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar;