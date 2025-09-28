// src/pages/MiApp.js
import React from 'react';
import { Layout, Card, Typography, Space, Button, Row, Col } from 'antd';
import { 
  MobileOutlined, 
  ReloadOutlined, 
  LinkOutlined,
  EyeOutlined 
} from '@ant-design/icons';

const { Content } = Layout;
const { Title, Text } = Typography;

const MiApp = () => {
  const appUrl = 'https://agustinos-app.vercel.app';

  const handleReload = () => {
    const iframe = document.getElementById('app-iframe');
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleOpenInNewTab = () => {
    window.open(appUrl, '_blank');
  };

  return (
    <div style={{ 
      padding: '24px',
      background: '#f5f5f5',
      minHeight: '100vh',
      width: '100%'
    }}>
      <div style={{ maxWidth: '100%', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <MobileOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div>
                  <Title level={2} style={{ margin: 0 }}>
                    Mi App - Vista en Vivo
                  </Title>
                  <Text type="secondary">
                    Visualización de la aplicación Agustinos en tiempo real
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleReload}
                >
                  Recargar
                </Button>
                <Button 
                  type="primary"
                  icon={<LinkOutlined />} 
                  onClick={handleOpenInNewTab}
                >
                  Abrir en Nueva Pestaña
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Información de la app */}
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>URL de la aplicación:</Text>
              <Text code style={{ marginLeft: 8 }}>{appUrl}</Text>
            </div>
            <Text type="secondary">
              Esta es una vista en tiempo real de tu aplicación Agustinos. 
              Aquí puedes ver cómo se ven los artículos publicados y probar la funcionalidad 
              desde la perspectiva del usuario final.
            </Text>
          </Space>
        </Card>

        {/* Simulador móvil */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: 'calc(100vh - 300px)'
        }}>
          <div style={{
            width: 414,
            height: 896,
            background: 'white',
            borderRadius: 25,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            position: 'relative',
            border: '8px solid #333'
          }}>
            
            {/* Notch del iPhone */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 150,
              height: 25,
              background: '#333',
              borderRadius: '0 0 15px 15px',
              zIndex: 10
            }} />
            
            {/* Badge de vista en vivo - REMOVIDO */}

            {/* Iframe de la app */}
            <iframe
              id="app-iframe"
              src={appUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: 17
              }}
              title="Aplicación Agustinos"
            />
          </div>
        </div>

        {/* Información adicional */}
        <Card 
          title={
            <Space>
              <EyeOutlined />
              Información de Visualización
            </Space>
          }
          style={{ marginTop: 24 }}
        >
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ color: '#1890ff', margin: 0 }}>
                  414×896
                </Title>
                <Text type="secondary">Resolución iPhone</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ color: '#52c41a', margin: 0 }}>
                  En Vivo
                </Title>
                <Text type="secondary">Datos en tiempo real</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Title level={4} style={{ color: '#fa8c16', margin: 0 }}>
                  Responsive
                </Title>
                <Text type="secondary">Adaptable a móvil</Text>
              </div>
            </Col>
          </Row>
        </Card>

      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MiApp;