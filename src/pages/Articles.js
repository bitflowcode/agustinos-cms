import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
  Row,
  Col,
  Tooltip,
  Avatar,
  Layout
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { articlesAPI } from '../utils/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Content } = Layout;

const ArticlesList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allArticles, setAllArticles] = useState([]); // Todos los artículos sin filtrar
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    section: ''
  });

  // Leer parámetro section de la URL al cargar
  useEffect(() => {
    const sectionFromURL = searchParams.get('section');
    if (sectionFromURL && sectionFromURL !== filters.section) {
      setFilters(prev => ({ ...prev, section: sectionFromURL }));
    }
  }, [searchParams, filters.section]);

  // Cargar TODOS los artículos (sin filtro de sección, manejado en frontend)
  const loadArticles = async () => {
    setLoading(true);
    try {
      // Obtener todos los artículos sin filtro (límite 200)
      const response = await articlesAPI.getArticles();
      
      if (response.success) {
        setAllArticles(response.data);
        message.success(`${response.data.length} artículos cargados`);
      }
    } catch (error) {
      message.error('Error al cargar artículos');
      console.error('Error loading articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar secciones desde /api/articles/sections
  const loadSections = async () => {
    try {
      const response = await articlesAPI.getSections();
      if (response.success) {
        // Extraer nombres únicos de secciones
        const sectionNames = Object.keys(response.data).map(sectionName => ({
          section_name: sectionName,
          article_count: response.data[sectionName].length
        }));
        setSections(sectionNames);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  // Eliminar artículo
  const handleDeleteArticle = async (articleId, articleTitle) => {
    try {
      const response = await articlesAPI.deleteArticle(articleId);
      
      if (response.success) {
        message.success(`Artículo "${articleTitle}" eliminado correctamente`);
        // Recargar la lista
        loadArticles();
      } else {
        message.error('Error al eliminar el artículo');
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      message.error('Error al eliminar el artículo');
    }
  };

  // Aplicar filtros (tanto búsqueda como sección, TODO en frontend)
  const applyFilters = useCallback(() => {
    let filtered = [...allArticles];

    // Filtro por sección (ahora en frontend)
    if (filters.section) {
      filtered = filtered.filter(article => 
        article.section === filters.section
      );
    }

    // Filtro por búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(searchLower) ||
        article.content?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredArticles(filtered);
  }, [allArticles, filters]);

  // Aplicar filtros cuando cambien los filtros o artículos
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      search: '',
      section: ''
    });
    // Limpiar parámetros de URL
    setSearchParams({});
  };

  // Cambiar sección y actualizar URL
  const handleSectionChange = (value) => {
    const newSection = value || '';
    setFilters(prev => ({ ...prev, section: newSection }));
    
    // Actualizar URL
    if (newSection) {
      setSearchParams({ section: newSection });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    loadSections();
    loadArticles();
  }, []);

  // Truncar texto
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    const cleanText = text.replace(/<[^>]*>/g, ''); // Quitar HTML
    return cleanText.length > maxLength ? cleanText.substring(0, maxLength) + '...' : cleanText;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Status del artículo
  const getStatusTag = (status) => {
    switch (status) {
      case 'published':
        return <Tag color="green">Publicado</Tag>;
      case 'draft':
        return <Tag color="orange">Borrador</Tag>;
      default:
        return <Tag color="blue">Activo</Tag>;
    }
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
            height: '48px'
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
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: '14px' }}>
            {truncateText(text, 60)}
          </Text>
          {record.content && (
            <Paragraph 
              type="secondary" 
              style={{ margin: '4px 0 0 0', fontSize: '12px' }}
            >
              {truncateText(record.content, 80)}
            </Paragraph>
          )}
        </div>
      )
    },
    {
      title: 'Sección',
      dataIndex: 'section',
      key: 'section',
      width: 120,
      render: (section) => (
        section ? (
          <Tag color="blue">{section}</Tag>
        ) : (
          <Tag color="default">Sin sección</Tag>
        )
      )
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Fecha',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {formatDate(date)}
        </Text>
      )
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Ver detalles">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                // Mostrar detalles del artículo
                message.info(`ID: ${record.id} | Creado: ${formatDate(record.created_at)} | Autor: ${record.author || 'Sin autor'}`);
              }}
            />
          </Tooltip>
          <Tooltip title="Editar">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/articles/edit/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Popconfirm
              title="¿Estás seguro de eliminar este artículo?"
              description={`Se eliminará "${truncateText(record.title, 40)}"`}
              onConfirm={() => handleDeleteArticle(record.id, record.title)}
              okText="Sí, eliminar"
              cancelText="Cancelar"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        {/* Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Button>
              <Title level={2} style={{ margin: 0 }}>
                Gestión de Artículos
              </Title>
            </Space>
            <Text type="secondary" className="results-text">
              {filteredArticles.length} de {allArticles.length} artículos
              {filters.section && ` - Sección: ${filters.section}`}
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => navigate('/articles/new')}
            >
              Nuevo Artículo
            </Button>
          </Col>
        </Row>

        {/* Filtros */}
        <Card className="filter-section" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Buscar por título o contenido..."
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                allowClear
              />
            </Col>
            <Col>
              <Select
                placeholder="Filtrar por sección"
                style={{ width: 200 }}
                value={filters.section || undefined}
                onChange={handleSectionChange}
                allowClear
              >
                {sections.map(section => (
                  <Option key={section.section_name} value={section.section_name}>
                    {section.section_name} ({section.article_count})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Space>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={handleClearFilters}
                >
                  Limpiar
                </Button>
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadArticles}
                  loading={loading}
                >
                  Actualizar
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Tabla de artículos */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredArticles}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} artículos`
            }}
            scroll={{ x: 800 }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

export default ArticlesList;