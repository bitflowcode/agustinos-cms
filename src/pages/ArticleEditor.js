import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Typography,
  message,
  Layout,
  Spin,
  Upload,
  DatePicker,
  Radio,
  Switch
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  UploadOutlined,
  VideoCameraOutlined,
  PlayCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { articlesAPI } from '../utils/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const { Content } = Layout;

// Para Functions proxy en Vercel, usamos rutas relativas
const API_BASE = '';

const ArticleEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sections, setSections] = useState([]);
  const [content, setContent] = useState('');
  const [currentArticle, setCurrentArticle] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [articleDate, setArticleDate] = useState(null);

  // Estados para video
  const [hasVideo, setHasVideo] = useState(false);
  const [videoType, setVideoType] = useState('url'); // 'url' o 'upload'
  const [videoUrl, setVideoUrl] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingVideoThumb, setUploadingVideoThumb] = useState(false);

  // Configuración básica del editor Quill
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'blockquote'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link', 'blockquote'
  ];

  // Función para detectar y validar URLs de video
  const detectVideoType = (url) => {
    if (!url) return null;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (url.includes('.mp4')) {
      return 'mp4';
    }
    return null;
  };

  // Función para convertir URL de YouTube a formato embed
  const getYouTubeEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  // Función para convertir URL de Vimeo a formato embed
  const getVimeoEmbedUrl = (url) => {
    const videoId = url.match(/vimeo\.com\/([0-9]+)/);
    return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : url;
  };

  // Procesar URL de video ingresada
  const handleVideoUrlChange = (url) => {
    setVideoUrl(url);
    
    if (url) {
      const detectedType = detectVideoType(url);
      if (detectedType === 'youtube') {
        const embedUrl = getYouTubeEmbedUrl(url);
        setVideoUrl(embedUrl);
      } else if (detectedType === 'vimeo') {
        const embedUrl = getVimeoEmbedUrl(url);
        setVideoUrl(embedUrl);
      }
    }
  };

  // Cargar artículo existente si está editando
  const loadArticle = useCallback(async (articleId) => {
    setLoading(true);
    try {
      const response = await articlesAPI.getArticleById(articleId);
      
      if (response.success) {
        const article = response.data;
        setCurrentArticle(article);
        
        // Llenar el formulario con los datos existentes
        form.setFieldsValue({
          title: article.title,
          section: article.section,
          subtitle: article.subtitle,
          description: article.description,
          date: article.date ? dayjs(article.date) : null
        });
        
        // Establecer el contenido en el editor
        setContent(article.content || '');
        
        // Establecer imagen y audio si existen
        setImageUrl(article.imageUrl || '');
        setAudioUrl(article.audioUrl || '');

        // Establecer datos de video si existen
        if (article.hasVideo) {
          setHasVideo(true);
          setVideoUrl(article.videoUrl || '');
          setVideoThumbnail(article.videoThumbnail || '');
          
          // Detectar el tipo de video basado en la URL
          const detectedType = detectVideoType(article.videoUrl);
          if (detectedType === 'mp4' || article.videoType === 'mp4') {
            setVideoType('upload');
          } else {
            setVideoType('url');
          }
        }
        
        message.success('Artículo cargado para edición');
      } else {
        message.error('No se pudo cargar el artículo');
        navigate('/articles');
      }
    } catch (error) {
      console.error('Error loading article:', error);
      message.error('Error al cargar el artículo');
      navigate('/articles');
    } finally {
      setLoading(false);
    }
  }, [navigate, form]);

  // Cargar secciones
  const loadSections = async () => {
    try {
      const response = await articlesAPI.getSections();
      
      if (response.success) {
        // Los datos vienen como: { "Buenos días": [...], "Evangelio": [...], etc }
        const sectionsData = response.data;
        
        // Convertir las claves del objeto en un array de secciones
        const sectionNames = Object.keys(sectionsData).map(sectionName => ({
          section_name: sectionName,
          article_count: sectionsData[sectionName].length
        }));
        
        setSections(sectionNames);
      }
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  // Función para subir imagen a Bunny CDN
  const handleImageUpload = async (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('Solo puedes subir archivos JPG, PNG o WebP');
      return false;
    }

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('La imagen debe ser menor a 5MB');
      return false;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
    
      // Obtener token de autenticación
      const token = localStorage.getItem('cms_token');
      
      // Upload real a Bunny CDN (API Route del CMS → backend)
      const response = await fetch('https://agustinos-cms.vercel.app/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    
      const result = await response.json();
      
      if (result.success) {
        setImageUrl(result.data.imageUrl);
        message.success('Imagen subida exitosamente');
      } else {
        message.error(result.error || 'Error al subir imagen');
      }

    } catch (error) {
      message.error('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }

    return false; // Prevenir upload automático de Ant Design
  };

  // Función para subir audio a Bunny CDN
  const handleAudioUpload = async (file) => {
    const isAudio = file.type.startsWith('audio/');
    if (!isAudio) {
      message.error('Solo puedes subir archivos de audio');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('El audio debe ser menor a 10MB');
      return false;
    }

    setUploadingAudio(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
    
      // Obtener token de autenticación
      const token = localStorage.getItem('cms_token');
      
      // Upload real a Bunny CDN (API Route del CMS → backend)
      const response = await fetch('https://agustinos-cms.vercel.app/api/upload-audio', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    
      const result = await response.json();
      
      if (result.success) {
        setAudioUrl(result.data.audioUrl);
        message.success('Audio subido exitosamente');
      } else {
        message.error(result.error || 'Error al subir audio');
      }

    } catch (error) {
      message.error('Error al subir el audio');
    } finally {
      setUploadingAudio(false);
    }

    return false; // Prevenir upload automático de Ant Design
  };

  // Función para subir video MP4 a Bunny CDN (servidor de Hetzner)
  const handleVideoUpload = async (file) => {
    const isVideo = file.type?.startsWith('video/');
    if (!isVideo) {
      message.error('Solo puedes subir archivos de video');
      return false;
    }

    // Sin límite de tamaño - streaming directo a Bunny CDN vía servidor Hetzner
    console.log(`Subiendo video de ${Math.round(file.size / 1024 / 1024)}MB...`);

    setUploadingVideo(true);

    try {
      // 1) Solicitar token temporal al servidor de Hetzner
      const tokenResponse = await fetch(`/api/upload/video-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('cms_token') || ''}`,
        },
        body: JSON.stringify({
          ext: 'mp4',
          dir: 'videos'
        }),
      });

      if (!tokenResponse.ok) {
        const tErr = await tokenResponse.text().catch(() => '');
        throw new Error(`Token request failed: ${tErr || tokenResponse.status}`);
      }

      const { token, finalUrl } = await tokenResponse.json();

      // 2) Subir el fichero directamente al servidor de Hetzner (streaming)
      const uploadResponse = await fetch(`/api/upload/video?token=${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'video/mp4',
          'Authorization': `Bearer ${localStorage.getItem('cms_token') || ''}`,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        const uErr = await uploadResponse.text().catch(() => '');
        throw new Error(`Upload failed: ${uErr || uploadResponse.status}`);
      }

      const result = await uploadResponse.json();
      
      if (result.success) {
        // 3) Guardar URL final (CDN)
        setVideoUrl(result.data.videoUrl);
        message.success('Video subido exitosamente');
      } else {
        throw new Error(result.error || 'Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error al subir el video:', error);
      message.error(error.message || 'Error al subir el video');
    } finally {
      setUploadingVideo(false);
    }

    // Evitar que Ant Design haga upload automático
    return false;
  };

  // ======== NUEVO: Subida de thumbnail de video ========
  const handleVideoThumbnailUpload = async (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
    if (!isJpgOrPng) {
      message.error('Solo puedes subir archivos JPG, PNG o WebP para el thumbnail');
      return false;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('El thumbnail debe ser menor a 2MB');
      return false;
    }

    setUploadingVideoThumb(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
    
      const token = localStorage.getItem('cms_token');
      
      // Usa la API Route del CMS (que proxyea al backend)
      const response = await fetch('https://agustinos-cms.vercel.app/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    
      const result = await response.json();
      
      if (result.success) {
        setVideoThumbnail(result.data.imageUrl);
        message.success('Thumbnail de video subido exitosamente');
      } else {
        message.error(result.error || 'Error al subir thumbnail');
      }

    } catch (error) {
      message.error('Error al subir el thumbnail');
    } finally {
      setUploadingVideoThumb(false);
    }

    return false;
  };

  // ======== NUEVO: Vista previa de video ========
  const renderVideoPreview = () => {
    if (!hasVideo || !videoUrl) return null;

    const detectedType = detectVideoType(videoUrl);

    if (detectedType === 'youtube' || detectedType === 'vimeo') {
      return (
        <div style={{ marginTop: 16 }}>
          <Text strong>Vista previa del video:</Text>
          <div style={{ marginTop: 8, border: '1px solid #d9d9d9', borderRadius: 4 }}>
            <iframe
              width="100%"
              height="200"
              src={videoUrl}
              frameBorder="0"
              allowFullScreen
              title="Video preview"
            />
          </div>
        </div>
      );
    } else if (detectedType === 'mp4') {
      return (
        <div style={{ marginTop: 16 }}>
          <Text strong>Vista previa del video:</Text>
          <div style={{ marginTop: 8 }}>
            <video
              width="100%"
              height="200"
              controls
              style={{ border: '1px solid #d9d9d9', borderRadius: 4 }}
            >
              <source src={videoUrl} type="video/mp4" />
              Tu navegador no soporta el elemento video.
            </video>
          </div>
        </div>
      );
    }

    return null;
  };

  // Guardar artículo (crear o actualizar)
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (!content.trim()) {
        message.error('El contenido es obligatorio');
        return;
      }

      setSaving(true);

      // Determinar el tipo real de video
      let finalVideoType = null;
      if (hasVideo && videoUrl) {
        if (videoType === 'upload') {
          finalVideoType = 'mp4';
        } else {
          finalVideoType = detectVideoType(videoUrl);
        }
      }

      const articleData = {
        title: values.title,
        subtitle: values.subtitle || null,
        description: values.description || null,
        content: content,
        section: values.section || 'General',
        imageUrl: imageUrl || null,
        hasAudio: Boolean(audioUrl),
        audioUrl: audioUrl || null,
        hasVideo: hasVideo,
        videoUrl: hasVideo ? videoUrl || null : null,
        videoType: hasVideo ? finalVideoType : null,
        videoThumbnail: hasVideo ? videoThumbnail || null : null,
        date: values.date ? values.date.toISOString() : null
      };

      let response;
      
      if (isEditing) {
        // Actualizar artículo existente
        response = await articlesAPI.updateArticle(id, articleData);
        message.success('Artículo actualizado exitosamente');
      } else {
        // Crear nuevo artículo
        response = await articlesAPI.createArticle(articleData);
        message.success('Artículo creado exitosamente');
      }

      if (response.success) {
        navigate('/articles');
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('Por favor completa todos los campos requeridos');
      } else {
        message.error(`Error al ${isEditing ? 'actualizar' : 'crear'} el artículo`);
        console.error('Error saving article:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadSections();
    
    // Si está editando, cargar el artículo
    if (isEditing && id) {
      loadArticle(id);
    }
  }, [isEditing, id, loadArticle]);

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Cargando artículo...</div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
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
                {isEditing ? `Editar: ${currentArticle?.title || 'Artículo'}` : 'Nuevo Artículo'}
              </Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSave}
                size="large"
              >
                {isEditing ? 'Actualizar Artículo' : 'Publicar Artículo'}
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={24}>
          {/* Editor Principal */}
          <Col xs={24} lg={18}>
            <Card>
            <Form
              form={form}
              layout="vertical"
              size="large"
            >
              {/* Título */}
              <Form.Item
                name="title"
                label="Título del artículo"
                rules={[
                  { required: true, message: 'El título es obligatorio' },
                  { min: 5, message: 'El título debe tener al menos 5 caracteres' }
                ]}
              >
                <Input 
                  placeholder="Escribe un título atractivo..."
                  style={{ fontSize: '18px', fontWeight: 'bold' }}
                />
              </Form.Item>

              {/* Subtítulo (opcional) */}
              <Form.Item
                name="subtitle"
                label="Subtítulo (opcional)"
              >
                <Input 
                  placeholder="Subtítulo del artículo..."
                />
              </Form.Item>

              {/* Descripción (opcional) */}
              <Form.Item
                name="description"
                label="Descripción (opcional)"
              >
                <Input.TextArea 
                  rows={2}
                  placeholder="Breve descripción del artículo..."
                />
              </Form.Item>

              {/* Campo de fecha de publicación */}
              <Form.Item
                name="date"
                label="Fecha de publicación"
                tooltip="Selecciona cuándo se publicará este artículo. Déjalo vacío para usar la fecha actual."
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Seleccionar fecha y hora"
                  style={{ width: '100%' }}
                  onChange={(value) => setArticleDate(value)}
                />
              </Form.Item>

              {/* Campo de imagen */}
              <Form.Item
                label="Imagen del artículo (opcional)"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    name="image"
                    listType="picture-card"
                    className="image-uploader"
                    showUploadList={false}
                    beforeUpload={handleImageUpload}
                    accept="image/*"
                  >
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt="article" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      <div>
                        <PlusOutlined />
                        <div style={{ marginTop: 8 }}>Subir imagen</div>
                      </div>
                    )}
                  </Upload>
                  {imageUrl && (
                    <Button 
                      danger 
                      size="small" 
                      onClick={() => setImageUrl('')}
                    >
                      Eliminar imagen
                    </Button>
                  )}
                </Space>
              </Form.Item>

              {/* Campo de audio */}
              <Form.Item
                label="Audio del artículo (opcional)"
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    name="audio"
                    showUploadList={false}
                    beforeUpload={handleAudioUpload}
                    accept="audio/*"
                  >
                    <Button icon={<UploadOutlined />}>
                      {audioUrl ? 'Cambiar audio' : 'Subir audio'}
                    </Button>
                  </Upload>
                  {audioUrl && (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <audio controls style={{ width: '100%' }}>
                        <source src={audioUrl} type="audio/mpeg" />
                        Tu navegador no soporta el elemento audio.
                      </audio>
                      <Button 
                        danger 
                        size="small" 
                        onClick={() => setAudioUrl('')}
                      >
                        Eliminar audio
                      </Button>
                    </Space>
                  )}
                </Space>
              </Form.Item>

              {/* NUEVA SECCIÓN: CAMPO DE VIDEO */}
              <Form.Item
                label={
                  <Space>
                    <VideoCameraOutlined />
                    <span>Video del artículo (opcional)</span>
                  </Space>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {/* Switch para habilitar video */}
                  <div>
                    <Switch
                      checked={hasVideo}
                      onChange={setHasVideo}
                      checkedChildren="Con video"
                      unCheckedChildren="Sin video"
                    />
                    {hasVideo && (
                      <Text type="secondary" style={{ marginLeft: 12 }}>
                        Este artículo incluirá un video
                      </Text>
                    )}
                  </div>

                  {hasVideo && (
                    <Card size="small" style={{ backgroundColor: '#f8f9fa' }}>
                      {/* Selector de tipo de video */}
                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Tipo de video:</Text>
                        <Radio.Group
                          value={videoType}
                          onChange={(e) => setVideoType(e.target.value)}
                          style={{ marginLeft: 12 }}
                        >
                          <Radio.Button value="url">
                            <PlayCircleOutlined /> URL (YouTube/Vimeo)
                          </Radio.Button>
                          <Radio.Button value="upload">
                            <UploadOutlined /> Subir MP4
                          </Radio.Button>
                        </Radio.Group>
                      </div>

                      {/* Campo URL o Upload según selección */}
                      {videoType === 'url' ? (
                        <div>
                          <Text strong>URL del video:</Text>
                          <Input
                            placeholder="Ej: https://www.youtube.com/watch?v=... o https://vimeo.com/..."
                            value={videoUrl}
                            onChange={(e) => handleVideoUrlChange(e.target.value)}
                            style={{ marginTop: 8 }}
                            suffix={videoUrl && <PlayCircleOutlined style={{ color: '#52c41a' }} />}
                          />
                          <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                            Soporta URLs de YouTube y Vimeo. Se convertirá automáticamente a formato embed.
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Text strong>Subir archivo de video:</Text>
                          <div style={{ marginTop: 8 }}>
                            <Upload
                              name="video"
                              showUploadList={false}
                              beforeUpload={handleVideoUpload}
                              accept="video/*"
                            >
                              <Button 
                                icon={<UploadOutlined />}
                                loading={uploadingVideo}
                              >
                                {videoUrl ? 'Cambiar video' : 'Subir video MP4'}
                              </Button>
                            </Upload>
                            <div style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                              Sin límite de tamaño. Formatos soportados: MP4, WebM, AVI
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Thumbnail del video */}
                      <div style={{ marginTop: 16 }}>
                        <Text strong>Thumbnail del video (opcional):</Text>
                        <div style={{ marginTop: 8 }}>
                          <Upload
                            name="videoThumbnail"
                            listType="picture-card"
                            showUploadList={false}
                            beforeUpload={handleVideoThumbnailUpload}
                            accept="image/*"
                          >
                            {videoThumbnail ? (
                              <img 
                                src={videoThumbnail} 
                                alt="video thumbnail" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              />
                            ) : (
                              <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8, fontSize: 12 }}>Thumbnail</div>
                              </div>
                            )}
                          </Upload>
                          {videoThumbnail && (
                            <Button 
                              danger 
                              size="small" 
                              onClick={() => setVideoThumbnail('')}
                              style={{ marginTop: 8 }}
                            >
                              Eliminar thumbnail
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Vista previa del video */}
                      {renderVideoPreview()}

                      {/* Botón para eliminar video */}
                      <div style={{ marginTop: 16, textAlign: 'right' }}>
                        <Button 
                          danger
                          size="small"
                          onClick={() => {
                            setHasVideo(false);
                            setVideoUrl('');
                            setVideoThumbnail('');
                            setVideoType('url');
                          }}
                        >
                          Eliminar video del artículo
                        </Button>
                      </div>
                    </Card>
                  )}
                </Space>
              </Form.Item>

              {/* Sección */}
              <Form.Item
                name="section"
                label="Sección"
              >
                <Select
                  placeholder="Selecciona una sección"
                  showSearch
                  allowClear
                  optionFilterProp="children"
                >
                  {sections.map(section => (
                    <Option key={section.section_name} value={section.section_name}>
                      {section.section_name} ({section.article_count} artículos)
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Editor de contenido */}
              <Form.Item
                label="Contenido del artículo"
                required
              >
                <div style={{ border: '1px solid #d9d9d9', borderRadius: 6 }}>
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ minHeight: 300 }}
                    placeholder="Escribe el contenido de tu artículo aquí..."
                  />
                </div>
                {!content.trim() && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 4 }}>
                    El contenido es obligatorio
                  </div>
                )}
              </Form.Item>
            </Form>
            </Card>
          </Col>

          {/* Panel lateral */}
          <Col xs={24} lg={6}>
            <Card title="Información" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Estado: </Text>
                  <Text strong>{isEditing ? 'Editando' : 'Nuevo artículo'}</Text>
                </div>
                {isEditing && currentArticle && (
                  <>
                    <div>
                      <Text type="secondary">ID: </Text>
                      <Text strong>{currentArticle.id}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Creado: </Text>
                      <Text strong>
                        {new Date(currentArticle.created_at).toLocaleDateString('es-ES')}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">Actualizado: </Text>
                      <Text strong>
                        {new Date(currentArticle.updated_at).toLocaleDateString('es-ES')}
                      </Text>
                    </div>
                  </>
                )}
                <div>
                  <Text type="secondary">Autor: </Text>
                  <Text strong>{currentArticle?.author || 'Agustinos'}</Text>
                </div>
                <div>
                  <Text type="secondary">Publicación: </Text>
                  <Text strong>
                    {form.getFieldValue('date') 
                      ? `Programada: ${dayjs(form.getFieldValue('date')).format('DD/MM/YYYY HH:mm')}` 
                      : 'Inmediata'
                    }
                  </Text>
                </div>
              </Space>
            </Card>

            <Card title="Contenido Multimedia" size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Imagen: </Text>
                  <Text strong>{imageUrl ? 'Sí' : 'No'}</Text>
                </div>
                <div>
                  <Text type="secondary">Audio: </Text>
                  <Text strong>{audioUrl ? 'Sí' : 'No'}</Text>
                </div>
                <div>
                  <Text type="secondary">Video: </Text>
                  <Text strong>{hasVideo ? `Sí (${detectVideoType(videoUrl) || 'No detectado'})` : 'No'}</Text>
                </div>
                {hasVideo && videoUrl && (
                  <div>
                    <Text type="secondary">Thumbnail: </Text>
                    <Text strong>{videoThumbnail ? 'Sí' : 'No'}</Text>
                  </div>
                )}
              </Space>
            </Card>

            <Card title="Estadísticas" size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text type="secondary">Caracteres: </Text>
                  <Text strong>{content.replace(/<[^>]*>/g, '').length}</Text>
                </div>
                <div>
                  <Text type="secondary">Palabras: </Text>
                  <Text strong>
                    {content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Tiempo de lectura: </Text>
                  <Text strong>
                    {Math.max(1, Math.ceil(content.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))} min
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default ArticleEditor;