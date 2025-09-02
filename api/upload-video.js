// api/upload-video.js - Proxy con fetch nativo (compatible con Vercel)

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  try {
    console.log('[UPLOAD] Proxying video upload with fetch...');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Authorization:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('Content-Length:', req.headers['content-length']);

    // Verificar tamaño (50MB máximo para videos)
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 50 * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        error: 'Archivo muy grande',
        maxSize: '50MB',
        receivedSize: `${Math.round(contentLength / 1024 / 1024 * 100) / 100}MB`
      });
    }
    
    // Usar fetch nativo (disponible en Vercel)
    const response = await fetch('http://49.12.239.163:3002/api/upload/video', {
      method: 'POST',
      body: req, // Stream del request directamente
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || '',
      },
      duplex: 'half', // Para streaming - REQUERIDO
    });

    console.log('[UPLOAD] Response status:', response.status);
    console.log('Response headers:', Object.keys(response.headers));

    // Si la respuesta es JSON
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // Si es otro tipo de respuesta, pasar como texto
      const data = await response.text();
      res.status(response.status).send(data);
    }

  } catch (error) {
    console.error('[UPLOAD] Error:', error.message);
    console.error('[UPLOAD] Error stack:', error.stack);
    
    // Errores específicos
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'Cannot connect to backend server',
        details: 'Backend server is not reachable'
      });
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      res.status(500).json({
        success: false,
        error: 'Fetch error',
        details: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Proxy error',
        details: error.message
      });
    }
  }
}