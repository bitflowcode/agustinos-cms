// src/pages/Dashboard.js - Versión actualizada sin header
import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Button, 
  Card, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Avatar,
  Space,
  Spin,
  Alert
} from 'antd';
import { 
  FileTextOutlined,
  SoundOutlined,
  AppstoreOutlined,
  PlusOutlined,
  EditOutlined,
  BarChartOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { articlesAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const statsResponse = await articlesAPI.getStats();
      setStats(statsResponse.data);
      
      const articlesResponse = await articlesAPI.getArticles();
      setRecentArticles(articlesResponse.data.slice(0, 5));
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSection = (sectionName) => {
    navigate(`/articles?section=${encodeURIComponent(sectionName)}`);
  };

  const navigateToArticles = () => {
    navigate('/articles');
  };

  const navigateToCreateArticle = () => {
    navigate('/articles/new');
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Spin size="large" />
        <p style={{ marginTop: '16px' }}>Cargando dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert message="Error" description={error} type="error" showIcon />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      background: '#f5f5f5', 
      minHeight: '100vh' 
    }}>
      
      {/* Título de bienvenida */}
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
          Dashboard
        </Title>
        <Text type="secondary">
          Resumen de tu contenido y actividad reciente
        </Text>
      </div>

      {/* Estadísticas Principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Artículos"
              value={stats?.total_articles || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Con Audio"
              value={stats?.articles_with_audio || 0}
              prefix={<SoundOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Secciones"
              value={stats?.total_sections || 0}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Días Activo"
              value={stats ? Math.floor((new Date() - new Date(stats.oldest_article)) / (1000 * 60 * 60 * 24)) : 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Secciones */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <AppstoreOutlined />
                Secciones
              </Space>
            }
            extra={
              <Button 
                type="link" 
                onClick={navigateToArticles}
                icon={<EditOutlined />}
              >
                Gestionar
              </Button>
            }
          >
            <List
              dataSource={stats?.sections || []}
              renderItem={(section) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      onClick={() => navigateToSection(section.name)}
                    >
                      Ver todos
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{section.name[0]}</Avatar>}
                    title={section.name}
                    description={`${section.count} artículos`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Artículos Recientes */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                Artículos Recientes
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                onClick={navigateToCreateArticle}
                icon={<PlusOutlined />}
              >
                Crear Nuevo
              </Button>
            }
          >
            <List
              dataSource={recentArticles}
              renderItem={(article) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      onClick={() => navigate(`/articles/edit/${article.id}`)}
                      icon={<EditOutlined />}
                    >
                      Editar
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      article.imageUrl ? 
                        <Avatar 
                          src={article.imageUrl} 
                          size={56}
                          style={{ 
                            borderRadius: '8px',
                            width: '56px',
                            height: '56px'
                          }}
                        /> : 
                        <Avatar 
                          icon={<FileTextOutlined />} 
                          size={56}
                          style={{ 
                            borderRadius: '8px',
                            width: '56px',
                            height: '56px'
                          }}
                        />
                    }
                    title={
                      <div>
                        {article.title}
                        {article.hasAudio && <SoundOutlined style={{ marginLeft: '8px', color: '#1890ff' }} />}
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary">{article.section}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(article.created_at).toLocaleDateString('es-ES')}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Acciones Rápidas */}
      <Card 
        title={
          <Space>
            <BarChartOutlined />
            Acciones Rápidas
          </Space>
        }
        style={{ marginTop: '16px' }}
      >
        <Space wrap>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large"
            onClick={navigateToCreateArticle}
          >
            Crear Artículo
          </Button>
          <Button 
            icon={<EditOutlined />} 
            size="large"
            onClick={navigateToArticles}
          >
            Gestionar Artículos
          </Button>
          <Button 
            icon={<SoundOutlined />} 
            size="large"
            onClick={() => navigate('/upload')}
          >
            Subir Archivos
          </Button>
          <Button 
            icon={<BarChartOutlined />} 
            size="large"
            onClick={() => navigate('/stats')}
          >
            Ver Estadísticas
          </Button>
        </Space>
      </Card>

      {/* Info del Sistema */}
      {stats && (
        <Card 
          title="Información del Sistema" 
          size="small" 
          style={{ marginTop: '16px' }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Text type="secondary">Artículo más antiguo:</Text><br />
              <Text>{new Date(stats.oldest_article).toLocaleDateString('es-ES')}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Artículo más reciente:</Text><br />
              <Text>{new Date(stats.newest_article).toLocaleDateString('es-ES')}</Text>
            </Col>
            <Col span={8}>
              <Text type="secondary">Últimos datos:</Text><br />
              <Text>Mostrando {stats.showing_recent} artículos recientes</Text>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;