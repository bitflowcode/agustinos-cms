// src/components/ArticlePreview.js
import React from 'react';
import { Modal, Typography, Space, Tag, Divider } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  FolderOutlined,
  PlayCircleOutlined,
  SoundOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const ArticlePreview = ({ visible, onClose, articleData }) => {
  if (!articleData) return null;

  const formatDate = (dateString) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  const renderVideoContent = () => {
    if (!articleData.hasVideo || !articleData.videoUrl) return null;

    const detectVideoType = (url) => {
      if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
      if (url.includes('vimeo.com')) return 'vimeo';
      if (url.includes('.mp4')) return 'mp4';
      return null;
    };

    const videoType = detectVideoType(articleData.videoUrl);

    if (videoType === 'youtube' || videoType === 'vimeo') {
      return (
        <div style={{ marginBottom: 24 }}>
          <iframe
            width="100%"
            height="315"
            src={articleData.videoUrl}
            frameBorder="0"
            allowFullScreen
            title="Article video"
            style={{ borderRadius: 8 }}
          />
        </div>
      );
    } else if (videoType === 'mp4') {
      return (
        <div style={{ marginBottom: 24 }}>
          <video
            width="100%"
            height="315"
            controls
            poster={articleData.videoThumbnail}
            style={{ borderRadius: 8 }}
          >
            <source src={articleData.videoUrl} type="video/mp4" />
            Tu navegador no soporta el elemento video.
          </video>
        </div>
      );
    }

    return null;
  };

  return (
    <Modal
      title="Vista previa del artículo"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      bodyStyle={{ 
        maxHeight: '80vh', 
        overflowY: 'auto',
        padding: '24px'
      }}
    >
      {/* Simulación del diseño de la app */}
      <div style={{ 
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        
        {/* Imagen principal */}
        {articleData.imageUrl && (
          <div style={{ marginBottom: 24 }}>
            <img
              src={articleData.imageUrl}
              alt={articleData.title}
              style={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'cover',
                borderRadius: 8
              }}
            />
          </div>
        )}

        {/* Título y subtítulo */}
        <div style={{ marginBottom: 16 }}>
          <Title level={2} style={{ marginBottom: 8, color: '#1d1d1d' }}>
            {articleData.title}
          </Title>
          
          {articleData.subtitle && (
            <Text style={{ 
              fontSize: 18, 
              color: '#666',
              fontWeight: 400
            }}>
              {articleData.subtitle}
            </Text>
          )}
        </div>

        {/* Metadatos */}
        <div style={{ marginBottom: 24 }}>
          <Space wrap>
            <Tag icon={<FolderOutlined />} color="blue">
              {articleData.section || 'General'}
            </Tag>
            
            <Tag icon={<CalendarOutlined />} color="default">
              {formatDate(articleData.date)}
            </Tag>
            
            <Tag icon={<UserOutlined />} color="default">
              Agustinos
            </Tag>

            {articleData.hasAudio && (
              <Tag icon={<SoundOutlined />} color="orange">
                Con audio
              </Tag>
            )}

            {articleData.hasVideo && (
              <Tag icon={<PlayCircleOutlined />} color="red">
                Con video
              </Tag>
            )}
          </Space>
        </div>

        <Divider />

        {/* Video (si existe) */}
        {renderVideoContent()}

        {/* Audio (si existe) */}
        {articleData.hasAudio && articleData.audioUrl && (
          <div style={{ marginBottom: 24 }}>
            <audio 
              controls 
              style={{ width: '100%' }}
              preload="metadata"
            >
              <source src={articleData.audioUrl} type="audio/mpeg" />
              Tu navegador no soporta el elemento audio.
            </audio>
          </div>
        )}

        {/* Contenido principal */}
        <div style={{ 
          fontSize: 16, 
          lineHeight: 1.8,
          color: '#333'
        }}>
          <div 
            dangerouslySetInnerHTML={{ __html: articleData.content }}
            style={{
              '& h1, & h2, & h3': { color: '#1d1d1d', marginTop: 24, marginBottom: 12 },
              '& p': { marginBottom: 16 },
              '& blockquote': { 
                borderLeft: '4px solid #1890ff', 
                paddingLeft: 16, 
                margin: '16px 0',
                fontStyle: 'italic',
                backgroundColor: '#f6f8fa'
              },
              '& img': { maxWidth: '100%', borderRadius: 8, margin: '16px 0' },
              '& ul, & ol': { paddingLeft: 24 },
              '& li': { marginBottom: 8 }
            }}
          />
        </div>

        {/* Footer simulado */}
        <Divider />
        <div style={{ 
          textAlign: 'center', 
          color: '#999',
          fontSize: 14,
          padding: 16
        }}>
          <Text type="secondary">
            ~ Orden de San Agustín ~
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default ArticlePreview;