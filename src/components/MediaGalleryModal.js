import React, { useState, useEffect } from 'react';
import { Modal, Spin, message, Input, Row, Col, Pagination, Empty, Card } from 'antd';
import { SearchOutlined, PictureOutlined } from '@ant-design/icons';
import { mediaAPI } from '../utils/api';

const { Search } = Input;

const MediaGalleryModal = ({ visible, onClose, onSelectImage }) => {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const pageSize = 12;

  // Cargar imágenes al abrir el modal
  useEffect(() => {
    if (visible) {
      loadImages();
    }
  }, [visible, currentPage]);

  // Filtrar imágenes por búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(img =>
        img.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredImages(filtered);
    }
  }, [searchTerm, images]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const response = await mediaAPI.getImages('images', currentPage, pageSize);
      
      if (response.success) {
        setImages(response.data.images);
        setFilteredImages(response.data.images);
        setTotalImages(response.data.total);
      } else {
        message.error('Error al cargar las imágenes');
      }
    } catch (error) {
      console.error('Error loading images:', error);
      message.error('Error al cargar la galería de imágenes');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleSelectImage = () => {
    if (selectedImage) {
      onSelectImage(selectedImage.url);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    setSearchTerm('');
    setCurrentPage(1);
    onClose();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setSelectedImage(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PictureOutlined style={{ fontSize: 20, color: '#1890ff' }} />
          <span>Galería de Medios - Bunny CDN</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleSelectImage}
      okText="Seleccionar imagen"
      cancelText="Cancelar"
      width={900}
      okButtonProps={{ disabled: !selectedImage }}
      style={{ top: 20 }}
    >
      {/* Barra de búsqueda */}
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Buscar imagen por nombre..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
        />
      </div>

      {/* Grid de imágenes */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16, color: '#666' }}>
            Cargando imágenes desde Bunny CDN...
          </div>
        </div>
      ) : filteredImages.length === 0 ? (
        <Empty
          description="No hay imágenes disponibles"
          style={{ padding: '60px 0' }}
        />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ minHeight: 400 }}>
            {filteredImages.map((image) => (
              <Col xs={12} sm={8} md={6} key={image.name}>
                <Card
                  hoverable
                  cover={
                    <div
                      style={{
                        height: 120,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzk5OSI+RXJyb3I8L3RleHQ+PC9zdmc+';
                        }}
                      />
                    </div>
                  }
                  bodyStyle={{
                    padding: 8,
                    backgroundColor: selectedImage?.name === image.name ? '#e6f7ff' : '#fff',
                    borderTop: selectedImage?.name === image.name ? '3px solid #1890ff' : 'none'
                  }}
                  onClick={() => handleImageClick(image)}
                >
                  <div style={{ fontSize: 11 }}>
                    <div
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: selectedImage?.name === image.name ? 'bold' : 'normal',
                        color: selectedImage?.name === image.name ? '#1890ff' : '#333'
                      }}
                      title={image.name}
                    >
                      {image.name}
                    </div>
                    <div style={{ color: '#999', marginTop: 4 }}>
                      {formatFileSize(image.size)}
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Paginación */}
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={currentPage}
              total={totalImages}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
              showTotal={(total) => `Total: ${total} imágenes`}
            />
          </div>
        </>
      )}

      {/* Información de la imagen seleccionada */}
      {selectedImage && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: '#f0f7ff',
            borderRadius: 6,
            border: '1px solid #91d5ff'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1890ff' }}>
            ✓ Imagen seleccionada:
          </div>
          <div style={{ fontSize: 12 }}>
            <div><strong>Nombre:</strong> {selectedImage.name}</div>
            <div><strong>Tamaño:</strong> {formatFileSize(selectedImage.size)}</div>
            <div><strong>Fecha:</strong> {formatDate(selectedImage.dateCreated)}</div>
            <div style={{ marginTop: 4 }}>
              <strong>URL:</strong>{' '}
              <a href={selectedImage.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11 }}>
                {selectedImage.url}
              </a>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default MediaGalleryModal;

