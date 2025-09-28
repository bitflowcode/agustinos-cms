// src/pages/Trash.js
import React, { useState, useEffect } from 'react';
import {
  Layout,
  Table,
  Card,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
  Empty,
  Alert
} from 'antd';
import {
  DeleteOutlined,
  UndoOutlined,
  ReloadOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { articlesAPI } from '../utils/api';
import dayjs from 'dayjs';

const { Content } = Layout;
const { Title, Text } = Typography;

const Trash = () => {
  const navigate = useNavigate();
  const [trashedArticles, setTrashedArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Función para cargar artículos de la papelera
  const loadTrashedArticles = async () => {
    setLoading(true);
    try {
      // Por ahora simulamos datos hasta que implementes el backend
      // const response = await articlesAPI.getTrashedArticles();
      
      // Datos simulados para desarrollo
      const simulatedData = [
        {
          id: 999,
          title: 'Artículo de prueba eliminado',
          section: 'Buenos días',
          deleted_at: '2025-09-27T10:30:00Z',
          deleted_by: 'CMS Admin'
        }
      ];
      
      setTrashedArticles(simulatedData);
      message.info('Cargando papelera... (funcionalidad en desarrollo)');
    } catch (error) {
      console.error('Error loading trashed articles:', error);
      message.error('Error al cargar la papelera');
    } finally {
      setLoading(false);
    }
  };

  // Restaurar artículo
  const handleRestoreArticle = async (articleId, articleTitle) => {
    try {
      // await articlesAPI.restoreArticle(articleId);
      message.success(`Artículo "${articleTitle}" restaurado correctamente`);
      loadTrashedArticles(); // Recargar lista
    } catch (error) {
      console.error('Error restoring article:', error);
      message.error('Error al restaurar el artículo');
    }
  };

  // Eliminar permanentemente
  const handlePermanentDelete = async (articleId, articleTitle) => {
    try {
      // await articlesAPI.permanentDeleteArticle(articleId);
      message.success(`Artículo "${articleTitle}" eliminado permanentemente`);
      loadTrashedArticles(); // Recargar lista
    } catch (error) {
      console.error('Error permanently deleting article:', error);
      message.error('Error al eliminar el artículo permanentemente');
    }
  };

  // Vaciar papelera completa
  const handleEmptyTrash = async () => {
    try {
      // await articlesAPI.emptyTrash();
      message.success('Papelera vaciada correctamente');
      setTrashedArticles([]);
    } catch (error) {
      console.error('Error emptying trash:', error);
      message.error('Error al vaciar la papelera');
    }
  };

  useEffect(() => {
    loadTrashedArticles();
  }, []);

  // Formatear fecha
  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  // Columnas de la tabla
  const columns = [
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <Text strong style={{ color: '#666' }}>
          {text}
        </Text>
      )
    },
    {
      title: 'Sección',
      dataIndex: 'section',
      key: 'section',
      width: 120,
      render: (section) => (
        <Tag color="default">{section}</Tag>
      )
    },
    {
      title: 'Eliminado',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      width: 150,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {formatDate(date)}
        </Text>
      )
    },
    {
      title: 'Eliminado por',
      dataIndex: 'deleted_by',
      key: 'deleted_by',
      width: 120,
      render: (user) => (
        <Text type="secondary">{user}</Text>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<UndoOutlined />}
            onClick={() => handleRestoreArticle(record.id, record.title)}
            style={{
              backgroundColor: '#52c41a',
              borderColor: '#52c41a'
            }}
          >
            Restaurar
          </Button>
          
          <Popconfirm
            title="Eliminar permanentemente"
            description={`¿Eliminar "${record.title}" para siempre? Esta acción no se puede deshacer.`}
            onConfirm={() => handlePermanentDelete(record.id, record.title)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ 
      padding: '24px',
      background: '#f5f5f5',
      minHeight: '100vh',
      width: '100%'
    }}>
      
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/articles')}
            >
              Volver a Artículos
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              Papelera
            </Title>
          </Space>
          <Text type="secondary">
            {trashedArticles.length} artículos eliminados
          </Text>
        </Col>
        <Col>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadTrashedArticles}
              loading={loading}
            >
              Actualizar
            </Button>
            {trashedArticles.length > 0 && (
              <Popconfirm
                title="Vaciar papelera"
                description="¿Eliminar todos los artículos de la papelera permanentemente? Esta acción no se puede deshacer."
                onConfirm={handleEmptyTrash}
                okText="Sí, vaciar"
                cancelText="Cancelar"
                okButtonProps={{ danger: true }}
                icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Vaciar Papelera
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Col>
      </Row>

      {/* Alerta informativa */}
      <Alert
        message="Información sobre la papelera"
        description="Los artículos eliminados se mantienen aquí durante 30 días antes de ser eliminados automáticamente. Puedes restaurarlos o eliminarlos permanentemente."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Tabla de artículos eliminados */}
      <Card>
        {trashedArticles.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No hay artículos en la papelera
                <br />
                <Text type="secondary">
                  Los artículos eliminados aparecerán aquí
                </Text>
              </span>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={trashedArticles}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} artículos eliminados`
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      {/* Información adicional */}
      <Card 
        title="Gestión de Papelera" 
        size="small" 
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Text type="secondary">Retención:</Text><br />
            <Text>30 días automático</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Restauración:</Text><br />
            <Text>Disponible en cualquier momento</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Eliminación permanente:</Text><br />
            <Text>Irreversible</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Trash;