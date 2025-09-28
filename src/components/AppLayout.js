// src/components/AppLayout.js
import React from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const location = useLocation();
  
  // Páginas que no necesitan sidebar (como login)
  const noSidebarPages = ['/login'];
  const shouldShowSidebar = !noSidebarPages.includes(location.pathname);

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout style={{ marginLeft: 280 }}>
        <Content style={{ overflow: 'auto' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;