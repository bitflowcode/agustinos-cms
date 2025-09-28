// src/utils/previewGenerator.js
export const generatePreviewHTML = (data) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `Escrito el ${date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })}`;
  };

  const renderVideo = () => {
    if (!data.hasVideo || !data.videoUrl) return '';

    if (data.videoUrl.includes('youtube.com') || data.videoUrl.includes('youtu.be')) {
      return `
        <div style="margin: 24px 0;">
          <iframe width="100%" height="200" src="${data.videoUrl}" frameborder="0" allowfullscreen style="border-radius: 12px;"></iframe>
        </div>
      `;
    } else if (data.videoUrl.includes('vimeo.com')) {
      return `
        <div style="margin: 24px 0;">
          <iframe width="100%" height="200" src="${data.videoUrl}" frameborder="0" allowfullscreen style="border-radius: 12px;"></iframe>
        </div>
      `;
    } else if (data.videoUrl.includes('.mp4')) {
      return `
        <div style="margin: 24px 0;">
          <video width="100%" height="200" controls ${data.videoThumbnail ? `poster="${data.videoThumbnail}"` : ''} style="border-radius: 12px;">
            <source src="${data.videoUrl}" type="video/mp4">
            Tu navegador no soporta el elemento video.
          </video>
        </div>
      `;
    }
    return '';
  };

  const renderAudio = () => {
    if (!data.hasAudio || !data.audioUrl) return '';
    
    return `
      <div style="background: rgba(255,255,255,0.9); margin: 24px 0; padding: 20px; border-radius: 16px; backdrop-filter: blur(10px);">
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="font-size: 18px; color: #333;">🎵 Audio del artículo</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 50px; height: 50px; background: #d4524f; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <span style="color: white; font-size: 20px;">▶</span>
          </div>
          <div style="flex: 1;">
            <div style="background: #ddd; height: 4px; border-radius: 2px; margin-bottom: 8px;">
              <div style="background: #d4524f; height: 4px; border-radius: 2px; width: 0%;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
              <span>0:00</span>
              <span>--:--</span>
            </div>
          </div>
        </div>
        <audio style="display: none;" controls>
          <source src="${data.audioUrl}" type="audio/mpeg">
        </audio>
      </div>
    `;
  };

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <title>Vista Previa - ${data.title}</title>
      <style>
        * { 
          margin: 0; 
          padding: 0; 
          box-sizing: border-box; 
        }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #f0f2f5;
          color: white;
          min-height: 100vh;
          overflow-x: hidden;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Simulación del móvil */
        .mobile-container {
          width: 414px;
          height: 896px;
          margin: 0 auto;
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          position: relative;
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
          border-radius: 25px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        /* Header rojo de la app */
        .app-header {
          background: linear-gradient(135deg, #e62c19 0%, #a01916 100%);
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding-top: 20px;
          flex-shrink: 0;
        }
        
        .back-button {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }
        
        .search-button {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
        }
        
        .section-title {
          color: white;
          font-size: 22px;
          font-weight: 600;
          text-align: center;
        }
        
        /* Badge de vista previa */
        .preview-badge {
          position: absolute;
          top: -10px;
          right: 16px;
          background: #ff4757;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: bold;
          z-index: 10;
        }
        
        /* Hero section con imagen de fondo */
        .hero-section {
          height: 280px;
          background-image: ${data.imageUrl ? `url('${data.imageUrl}')` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 24px;
        }
        
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(transparent 0%, rgba(0,0,0,0.7) 100%);
        }
        
        .hero-content {
          position: relative;
          z-index: 2;
        }
        
        .article-title {
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin-bottom: 12px;
          line-height: 1.3;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        
        .article-meta {
          font-size: 14px;
          color: rgba(255,255,255,0.9);
          margin-bottom: 8px;
        }
        
        .article-author {
          font-size: 16px;
          color: white;
          font-weight: 500;
        }
        
        /* Contenido principal */
        .content-section {
          background: white;
          margin-top: -20px;
          border-radius: 20px 20px 0 0;
          padding: 32px 24px 40px;
          position: relative;
          z-index: 3;
          min-height: calc(100vh - 400px);
        }
        
        .content-title {
          text-align: center;
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }
        
        .content-subtitle {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-bottom: 32px;
        }
        
        .article-content {
          color: #333;
          font-size: 16px;
          line-height: 1.7;
        }
        
        .article-content h1, 
        .article-content h2, 
        .article-content h3 {
          color: #2c3e50;
          margin: 24px 0 16px;
          font-weight: 600;
        }
        
        .article-content p {
          margin-bottom: 16px;
        }
        
        .article-content blockquote {
          border-left: 4px solid #d4524f;
          padding-left: 16px;
          margin: 20px 0;
          font-style: italic;
          background: #f8f9fa;
          padding: 16px;
          border-radius: 8px;
        }
        
        .article-content img {
          width: 100%;
          border-radius: 12px;
          margin: 20px 0;
        }
        
        .article-content ul, 
        .article-content ol {
          padding-left: 20px;
          margin-bottom: 16px;
        }
        
        .article-content li {
          margin-bottom: 8px;
        }
        
        /* Responsive */
        @media (max-width: 375px) {
          .mobile-container {
            width: 100vw;
          }
          
          .hero-section {
            height: 250px;
            padding: 20px;
          }
          
          .article-title {
            font-size: 20px;
          }
          
          .content-section {
            padding: 24px 20px 100px;
          }
        }
      </style>
    </head>
    <body>
      <div class="mobile-container">
        
        <!-- Header de la app -->
        <div class="app-header">
          <div class="preview-badge">VISTA PREVIA</div>
          <div class="back-button">←</div>
          <div class="section-title">${data.section || 'General'}</div>
          <div class="search-button">🔍</div>
        </div>
        
        <!-- Hero section con imagen -->
        <div class="hero-section">
          <div class="hero-overlay"></div>
          <div class="hero-content">
            <h1 class="article-title">${data.title}</h1>
            <div class="article-meta">${formatDate(data.date)}</div>
            <div class="article-author">${data.author}</div>
          </div>
        </div>
        
        <!-- Contenido principal -->
        <div class="content-section">
          ${data.subtitle ? `
            <div class="content-title">Texto: ${data.author}</div>
            <div class="content-subtitle">${data.subtitle}</div>
          ` : `
            <div class="content-title">Texto: ${data.author}</div>
          `}
          
          ${renderAudio()}
          ${renderVideo()}
          
          <div class="article-content">
            ${data.content}
          </div>
        </div>
        
      </div>
      
      <script>
        // Simulación básica del reproductor de audio
        document.addEventListener('click', function(e) {
          if (e.target.closest('.audio')) {
            const audio = document.querySelector('audio');
            if (audio) {
              if (audio.paused) {
                audio.play();
              } else {
                audio.pause();
              }
            }
          }
        });
      </script>
    </body>
    </html>
  `;
};