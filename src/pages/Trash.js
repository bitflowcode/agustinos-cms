import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Space,
  Tag,
  message,
  Typography,
  Row,
  Col,
  Popconfirm,
  Empty,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  RollbackOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getTrashArticles, restoreArticle, deletePermanently } from '../utils/trashApi';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const Trash = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cargar artículos en papelera
  const loadTrashArticles = async () => {
    setLoading(true);
    try {
      const response = await getTrashArticles();
      
      if (response.success) {
        setArticles(response.data);
        message.success(`${response.data.length} artículos en papelera`);
      }
    } catch (error) {
      message.error('Error al cargar la papelera');
      console.error('Error loading trash:', error);
    } finally {
      setLoading(false);
    }
  };

  // Restaurar artículo
  const handleRestore = async (articleId, articleTitle) => {
    try {
      const response = await restoreArticle(articleId);
      
      if (response.success) {
        message.success(`"${articleTitle}" restaurado correctamente`);
        loadTrashArticles(); // Recargar lista
      } else {
        message.error('Error al restaurar artículo');
      }
    } catch (error) {
      console.error('Error restoring article:', error);
      message.error('Error al restaurar artículo');
    }
  };

  // Eliminar permanentemente
  const handleDeletePermanently = async (articleId, articleTitle) => {
    try {
      const response = await deletePermanently(articleId);
      
      if (response.success) {
        message.success(`"${articleTitle}" eliminado permanentemente`);
        loadTrashArticles(); // Recargar lista
      } else {
        message.error('Error al eliminar permanentemente');
      }
    } catch (error) {
      console.error('Error deleting permanently:', error);
      message.error('Error al eliminar permanentemente');
    }
  };

  useEffect(() => {
    loadTrashArticles();
  }, []);

  // Truncar texto
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    const cleanText = text.replace(/<[^>]*>/g, '');
    return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  // Columnas de la tabla
  const columns = [
    {
      title: '',
      dataIndex: 'imageUrl',
      key: 'image',
      width: 70,
      render: (imageUrl) => (
        <Avatar
          size={48}
          src={imageUrl}
          style={{ 
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            width: '48px',
            height: '48px',
            opacity: 0.6
          }}
        >
          {!imageUrl && '📄'}
        </Avatar>
      )
    },
    {
      title: 'Título',
      dataIndex: 'title',
      key: 'title',
      render: (text) => (
        <div>
          <Text strong style={{ fontSize: '14px', color: '#999' }}>
            {truncateText(text, 60)}
          </Text>
        </div>
      )
    },
    {
      title: 'Sección',
      dataIndex: 'section',
      key: 'section',
      width: 140,
      render: (section) => (
        section ? (
          <Tag color="default">{section}</Tag>
        ) : (
          <Tag color="default">Sin sección</Tag>
        )
      )
    },
    {
      title: 'Autor',
      dataIndex: 'author',
      key: 'author',
      width: 120,
      render: (author) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {author || 'Sin autor'}
        </Text>
      )
    },
    {
      title: 'Eliminado',
      dataIndex: 'deleted_at',
      key: 'deleted_at',
      width: 160,
      render: (deleted_at) => (
        <Text type="danger" style={{ fontSize: '12px' }}>
          🗑️ {formatDate(deleted_at)}
        </Text>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <Space>
          <Popconfirm
            title="¿Restaurar artículo?"
            description={`"${truncateText(record.title, 40)}" volverá a estar activo`}
            onConfirm={() => handleRestore(record.id, record.title)}
            okText="Sí, restaurar"
            cancelText="Cancelar"
          >
            <Button
              type="primary"
              icon={<RollbackOutlined />}
              size="small"
            >
              Restaurar
            </Button>
          </Popconfirm>

          <Popconfirm
            title="¿Eliminar PERMANENTEMENTE?"
            description="Esta acción NO se puede deshacer"
            onConfirm={() => handleDeletePermanently(record.id, record.title)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ 
      padding: '24px', 
      background: '#f0f2f5', 
      minHeight: '100vh' 
    }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/articles')}
            >
              Artículos
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              🗑️ Papelera
            </Title>
          </Space>
          <Text type="secondary">
            {articles.length} artículo{articles.length !== 1 ? 's' : ''} eliminado{articles.length !== 1 ? 's' : ''}
          </Text>
        </Col>
        <Col>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadTrashArticles}
            loading={loading}
          >
            Actualizar
          </Button>
        </Col>
      </Row>

      {/* Tabla de artículos eliminados */}
      <Card>
        {articles.length === 0 && !loading ? (
          <Empty
            description="No hay artículos en la papelera"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={articles}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} artículos`
            }}
            scroll={{ x: 800 }}
          />
        )}
      </Card>
    </div>
  );
};

export default Trash;