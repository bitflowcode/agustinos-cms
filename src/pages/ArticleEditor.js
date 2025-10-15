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
  PlayCircleOutlined,
  EyeOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { articlesAPI } from '../utils/api';
import { generatePreviewHTML } from '../utils/previewGenerator';
import MediaGalleryModal from '../components/MediaGalleryModal';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

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

  // Estado para galería de medios
  const [galleryVisible, setGalleryVisible] = useState(false);

  // Función para subir imagen desde el editor Quill
  const handleQuillImageUpload = async (file) => {
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

    try {
      const formData = new FormData();
      formData.append('file', file);
    
      const token = localStorage.getItem('cms_token');
      
      const response = await fetch('https://agustinos-cms.vercel.app/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    
      const result = await response.json();
      
      if (result.success) {
        message.success('Imagen insertada en el contenido');
        return result.data.imageUrl;
      } else {
        message.error(result.error || 'Error al subir imagen');
        return false;
      }

    } catch (error) {
      message.error('Error al subir la imagen');
      return false;
    }
  };

  // Handler personalizado para imágenes en Quill
  const handleImageInsert = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        const imageUrl = await handleQuillImageUpload(file);
        if (imageUrl) {
          // Insertar la imagen en el editor
          const quill = document.querySelector('.ql-editor').__quill;
          const range = quill.getSelection();
          quill.insertEmbed(range.index, 'image', imageUrl);
          quill.setSelection(range.index + 1);
        }
      }
    };
  };

  // Configuración del editor Quill
  const quillModules = {
    toolbar: [
      // Encabezados
      [{ 'header': [1, 2, 3, false] }],
      
      // Formato básico
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      
      // Alineación
      [{ 'align': [] }],
      
      // Listas
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      
      // Elementos especiales
      ['blockquote', 'code-block'],
      ['link', 'image'],
      
      // Herramientas
      ['clean']
    ]
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'align',
    'list', 'bullet',
    'blockquote', 'code-block',
    'link', 'image'
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
        
        // ✅ CRÍTICO: Usar setTimeout para asegurar que el DOM esté listo
        setTimeout(() => {
          form.setFieldsValue({
            title: article.title,
            subtitle: article.subtitle,
            section: article.section,
            date: article.date ? dayjs(article.date) : null
          });
          
          console.log('✅ Valores seteados:', {
            section: article.section,
            date: article.date
          });
        }, 300);
        
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

// Función para subir audio a Bunny CDN (streaming directo - sin límite de tamaño)
const handleAudioUpload = async (file) => {
  const isAudio = file.type.startsWith('audio/');
  if (!isAudio) {
    message.error('Solo puedes subir archivos de audio');
    return false;
  }

  // Sin límite de tamaño - streaming directo a Bunny CDN vía servidor Hetzner
  console.log(`Subiendo audio de ${Math.round(file.size / 1024 / 1024)}MB...`);

  setUploadingAudio(true);

  try {
    // 1) Solicitar token temporal al servidor de Hetzner
    const tokenResponse = await fetch(`/api/upload/audio-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('cms_token') || ''}`,
      },
      body: JSON.stringify({
        ext: file.name.split('.').pop() || 'mp3',
        dir: 'audios'
      }),
    });

    if (!tokenResponse.ok) {
      const tErr = await tokenResponse.text().catch(() => '');
      throw new Error(`Token request failed: ${tErr || tokenResponse.status}`);
    }

    const { token, finalUrl } = await tokenResponse.json();

    // 2) Subir el fichero directamente al servidor de Hetzner (streaming)
    const uploadResponse = await fetch(`/api/upload/audio?token=${encodeURIComponent(token)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'audio/mpeg',
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
      setAudioUrl(result.data.audioUrl);
      message.success('Audio subido exitosamente');
    } else {
      throw new Error(result.error || 'Error en la respuesta del servidor');
    }
  } catch (error) {
    console.error('Error al subir el audio:', error);
    message.error(error.message || 'Error al subir el audio');
  } finally {
    setUploadingAudio(false);
  }

  // Evitar que Ant Design haga upload automático
  return false;
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

  // Función previsualización del artículo
  const openPreview = () => {
    const formValues = form.getFieldsValue();
    
    const previewData = {
      title: formValues.title || 'Título del artículo',
      subtitle: formValues.subtitle || '',
      content: content || '<p>Contenido del artículo...</p>',
      section: formValues.section || 'General',
      imageUrl: imageUrl || '',
      hasAudio: Boolean(audioUrl),
      audioUrl: audioUrl || '',
      hasVideo: hasVideo,
      videoUrl: videoUrl || '',
      videoType: videoType,
      videoThumbnail: videoThumbnail || '',
      date: formValues.date ? formValues.date.toISOString() : new Date().toISOString(),
      author: 'Agustinos'
    };
  
    // Generar HTML usando la función externa
    const previewHTML = generatePreviewHTML(previewData);
    
    // Abrir nueva pestaña con el contenido
    const newWindow = window.open('', '_blank');
    newWindow.document.write(previewHTML);
    newWindow.document.close();
    newWindow.focus();
  };

  // Guardar artículo (crear, actualizar o borrador)
  const handleSave = async (isDraft = false) => {
    try {
      const values = await form.validateFields();
      
      console.log('📝 Valores del formulario:', values);
      console.log('📝 Guardando como borrador:', isDraft);
      
      // Permitir guardar sin contenido
      // if (!content.trim()) {
      //   message.error('El contenido es obligatorio');
      //   return;
      // }
  
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
  
      // Asegurar que date SIEMPRE tenga un valor válido
      let finalDate;
      if (values.date && dayjs.isDayjs(values.date)) {
        finalDate = values.date.toISOString();
      } else if (isEditing && currentArticle?.date) {
        finalDate = currentArticle.date;
      } else {
        finalDate = new Date().toISOString();
      }
  
      // 🆕 Determinar el status basado en si es borrador o no
      let finalStatus;
      if (isDraft) {
        // Si se guarda como borrador, siempre es 'draft'
        finalStatus = 'draft';
      } else if (values.date && dayjs(values.date).isAfter(dayjs())) {
        // Si tiene fecha futura, es 'scheduled'
        finalStatus = 'scheduled';
      } else {
        // Si no, es 'published'
        finalStatus = 'published';
      }
  
      const articleData = {
        title: values.title,
        subtitle: values.subtitle || null,
        content: content,
        section: values.section || 'General',
        imageUrl: imageUrl || null,
        hasAudio: Boolean(audioUrl),
        audioUrl: audioUrl || null,
        hasVideo: hasVideo,
        videoUrl: hasVideo ? videoUrl || null : null,
        videoType: hasVideo ? finalVideoType : null,
        videoThumbnail: hasVideo ? videoThumbnail || null : null,
        date: finalDate,
        status: finalStatus
      };
  
      let response;
      
      if (isEditing) {
        response = await articlesAPI.updateArticle(id, articleData);
        message.success(isDraft ? 'Borrador guardado' : 'Artículo actualizado exitosamente');
      } else {
        response = await articlesAPI.createArticle(articleData);
        message.success(isDraft ? 'Borrador guardado' : 'Artículo creado exitosamente');
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

  // Reinicializar el editor cuando cambie el contenido
  useEffect(() => {
    if (content && isEditing) {
      // Pequeño delay para asegurar que el DOM esté listo
      const timer = setTimeout(() => {
        const quillElement = document.querySelector('.ql-toolbar');
        if (quillElement) {
          quillElement.style.display = 'block';
          quillElement.style.visibility = 'visible';
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [content, isEditing]);

  if (loading) {
    return (
      <div style={{ 
        padding: '24px', 
        background: '#f0f2f5', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Cargando artículo...</div>
      </div>
    );
  }

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
                icon={<EyeOutlined />}
                onClick={openPreview}
                size="large"
                style={{
                  borderColor: '#1890ff',
                  color: '#1890ff'
                }}
              >
                Vista Previa
              </Button>
              <Button
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => handleSave(true)}
                size="large"
                style={{
                  borderColor: '#d9d9d9',
                  color: '#595959'
                }}
              >
                Guardar Borrador
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => handleSave(false)}
                size="large"
              >
                {isEditing ? 'Actualizar y Publicar' : 'Publicar Artículo'}
              </Button>
            </Space>
          </Col>
        </Row>

            <Form
              form={form}
              layout="vertical"
              size="large"
            >
              <Row gutter={24}>
                {/* Editor Principal */}
                <Col xs={24} lg={18}>
                  <Card>
              {/* Sección: Información Básica */}
              <div style={{ 
                marginBottom: 24, 
                paddingBottom: 16, 
                borderBottom: '2px solid #f0f0f0' 
              }}>
                <Title level={4} style={{ 
                  color: '#1890ff', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  📋 Información Básica
                </Title>
                
                {/* Título */}
                <Form.Item
                  name="title"
                  label={
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: '#262626'
                    }}>
                      Título del artículo
                    </span>
                  }
                  rules={[
                    { required: true, message: 'El título es obligatorio' },
                    { min: 5, message: 'El título debe tener al menos 5 caracteres' }
                  ]}
                >
                  <Input 
                    placeholder="Escribe un título atractivo..."
                    style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '2px solid #d9d9d9'
                    }}
                  />
                </Form.Item>

                {/* Subtítulo (opcional) */}
                <Form.Item
                  name="subtitle"
                  label={
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#595959'
                    }}>
                      Subtítulo (opcional)
                    </span>
                  }
                >
                  <Input 
                    placeholder="Subtítulo del artículo..."
                    style={{ 
                      padding: '10px 14px',
                      borderRadius: '6px'
                    }}
                  />
                </Form.Item>
              </div>

              {/* Sección: Contenido Multimedia */}
              <div style={{ 
                marginBottom: 24, 
                paddingBottom: 16, 
                borderBottom: '2px solid #f0f0f0' 
              }}>
                <Title level={4} style={{ 
                  color: '#52c41a', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  🎨 Contenido Multimedia
                </Title>

                {/* Campo de imagen */}
                <Form.Item
                  label={
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: '600',
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      🖼️ Imagen del artículo (opcional)
                    </span>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {/* Vista previa de la imagen */}
                    {imageUrl && (
                      <div style={{ 
                        border: '2px solid #d9d9d9', 
                        borderRadius: '8px', 
                        padding: '8px',
                        backgroundColor: '#fafafa'
                      }}>
                        <img 
                          src={imageUrl} 
                          alt="article" 
                          style={{ 
                            width: '100%', 
                            maxHeight: '200px',
                            objectFit: 'contain',
                            borderRadius: '6px' 
                          }} 
                        />
                      </div>
                    )}
                    
                    {/* Botones de acción */}
                    <Space>
                      <Upload
                        name="image"
                        showUploadList={false}
                        beforeUpload={handleImageUpload}
                        accept="image/*"
                      >
                        <Button 
                          icon={<UploadOutlined />}
                          loading={uploadingImage}
                          style={{ borderRadius: '6px' }}
                        >
                          {imageUrl ? 'Cambiar imagen' : 'Subir desde dispositivo'}
                        </Button>
                      </Upload>
                      
                      <Button 
                        icon={<PictureOutlined />}
                        onClick={() => setGalleryVisible(true)}
                        style={{ borderRadius: '6px', borderColor: '#52c41a', color: '#52c41a' }}
                      >
                        Galería de Bunny CDN
                      </Button>
                      
                      {imageUrl && (
                        <Button 
                          danger 
                          size="small" 
                          onClick={() => setImageUrl('')}
                          style={{ borderRadius: '6px' }}
                        >
                          Eliminar
                        </Button>
                      )}
                    </Space>
                  </Space>
                </Form.Item>

                {/* Campo de audio */}
                <Form.Item
                  label={
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: '600',
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      🎵 Audio del artículo (opcional)
                    </span>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Upload
                      name="audio"
                      showUploadList={false}
                      beforeUpload={handleAudioUpload}
                      accept="audio/*"
                    >
                      <Button 
                        icon={<UploadOutlined />}
                        style={{ borderRadius: '6px', height: '40px' }}
                      >
                        {audioUrl ? 'Cambiar audio' : 'Subir audio'}
                      </Button>
                    </Upload>
                    {audioUrl && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <audio controls style={{ width: '100%', borderRadius: '6px' }}>
                          <source src={audioUrl} type="audio/mpeg" />
                          Tu navegador no soporta el elemento audio.
                        </audio>
                        <Button 
                          danger 
                          size="small" 
                          onClick={() => setAudioUrl('')}
                          style={{ borderRadius: '6px' }}
                        >
                          Eliminar audio
                        </Button>
                      </Space>
                    )}
                  </Space>
                </Form.Item>
              </div>

              {/* Sección: Video */}
              <div style={{ 
                marginBottom: 24, 
                paddingBottom: 16, 
                borderBottom: '2px solid #f0f0f0' 
              }}>
                <Title level={4} style={{ 
                  color: '#fa8c16', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  🎬 Video del Artículo
                </Title>

                <Form.Item
                  label={
                    <span style={{ 
                      fontSize: '15px', 
                      fontWeight: '600',
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      <VideoCameraOutlined />
                      Video del artículo (opcional)
                    </span>
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
              </div>

              {/* Sección: Contenido Principal */}
              <div style={{ 
                marginBottom: 24, 
                paddingBottom: 16, 
                borderBottom: '2px solid #f0f0f0' 
              }}>
                <Title level={4} style={{ 
                  color: '#722ed1', 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  ✏️ Contenido Principal
                </Title>

                <Form.Item
                  label={
                    <span style={{ 
                      fontSize: '16px', 
                      fontWeight: 'bold',
                      color: '#262626',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}>
                      📄 Contenido del artículo
                      <span style={{ 
                        color: '#8c8c8c', 
                        fontSize: '14px',
                        marginLeft: 4,
                        fontWeight: 'normal'
                      }}>
                        (opcional)
                      </span>
                    </span>
                  }
                >
                <div 
                  className="quill-editor-wrapper"
                  style={{ 
                    border: '2px solid #d9d9d9', 
                    borderRadius: '8px',
                    backgroundColor: '#fff',
                    overflow: 'hidden'
                  }}
                >
                  <ReactQuill
                    key={`quill-${isEditing ? id : 'new'}`}
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Escribe el contenido de tu artículo aquí..."
                    style={{
                      height: '400px'
                    }}
                  />
                </div>
                </Form.Item>
              </div>
            </Card>
          </Col>

          {/* Panel lateral */}
          <Col xs={24} lg={6}>
            {/* Programar publicación */}
            <Card 
              title={
                <Space>
                  <span style={{ color: '#1890ff', fontWeight: 'bold' }}>📅</span>
                  <span style={{ fontWeight: 'bold' }}>Programar publicación</span>
                </Space>
              } 
              size="small"
              style={{ marginBottom: 16, border: '2px solid #1890ff', borderRadius: 8 }}
            >
              <Form.Item
                name="date"
                style={{ marginBottom: 0 }}
                tooltip="Selecciona cuándo se publicará este artículo. Déjalo vacío para usar la fecha actual."
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Seleccionar fecha y hora"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Card>

            {/* Sección */}
            <Card 
              title={
                <Space>
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>📂</span>
                  <span style={{ fontWeight: 'bold' }}>Sección</span>
                </Space>
              } 
              size="small"
              style={{ marginBottom: 16, border: '2px solid #52c41a', borderRadius: 8 }}
            >
              <Form.Item
                name="section"
                style={{ marginBottom: 0 }}
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
            </Card>

            <Card 
              title={
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  ℹ️ Información
                </span>
              } 
              size="small"
            >
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

            <Card 
              title={
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#52c41a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  🎨 Contenido Multimedia
                </span>
              } 
              size="small" 
              style={{ marginTop: 16 }}
            >
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

            <Card 
              title={
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: '#722ed1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  📊 Estadísticas
                </span>
              } 
              size="small" 
              style={{ marginTop: 16 }}
            >
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
                <div>
                  <Text type="secondary">Imágenes en contenido: </Text>
                  <Text strong>
                    {(content.match(/<img[^>]+>/g) || []).length}
                  </Text>
                </div>
                <div>
                  <Text type="secondary">Enlaces: </Text>
                  <Text strong>
                    {(content.match(/<a[^>]+>/g) || []).length}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
        </Form>

        {/* Modal de Galería de Medios */}
        <MediaGalleryModal
          visible={galleryVisible}
          onClose={() => setGalleryVisible(false)}
          onSelectImage={(url) => {
            setImageUrl(url);
            message.success('Imagen seleccionada desde la galería');
          }}
        />
      </div>
  );
};

export default ArticleEditor;