// api/cms.js — Proxy del CMS hacia el backend (listar/crear, etc.)
module.exports = async (req, res) => {
  // Logging para diagnóstico
  console.log('[cms] Request:', {
    method: req.method,
    url: req.url,
    headers: {
      authorization: req.headers.authorization ? 'present' : 'missing',
      contentType: req.headers['content-type']
    }
  });

  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BACKEND_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.CMS_BACKEND ||
    'http://49.12.239.163:3002';

  const urlStr = req.url || '';
  const search = urlStr.includes('?') ? urlStr.slice(urlStr.indexOf('?')) : '';

  // Función helper para fetch con timeout
  const fetchWithTimeout = (url, options, timeout = 25000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  };

  // URL principal (sin candidatos múltiples para ser más rápido)
  const url = `${BACKEND_BASE}/api/articles/cms${search}`;

  try {
    console.log('[cms] Fetching:', url);
    const startTime = Date.now();

    const upstream = await fetchWithTimeout(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
    }, 25000); // 25 segundos de timeout

    const duration = Date.now() - startTime;
    console.log(`[cms] Response received in ${duration}ms, status: ${upstream.status}`);

    const status = upstream.status;
    const ct = upstream.headers.get('content-type') || '';

    if (!ct.includes('application/json')) {
      const text = await upstream.text().catch(() => '');
      return res.status(status).send(text);
    }

    const json = await upstream.json().catch(() => null);
    
    if (!json) {
      return res.status(status).json({ 
        success: false, 
        error: 'Invalid JSON from upstream' 
      });
    }

    // Normaliza si no trae envelope
    if (Object.prototype.hasOwnProperty.call(json, 'success')) {
      return res.status(status).json(json);
    } else {
      return res.status(status).json({ 
        success: status >= 200 && status < 300, 
        data: json 
      });
    }

  } catch (error) {
    console.error('[api/cms] Proxy error:', error);
    
    // Mensaje más específico si es timeout
    if (error.message === 'Request timeout') {
      return res.status(504).json({ 
        success: false, 
        error: 'Backend timeout - el servidor tardó demasiado en responder',
        details: 'Intenta reducir el límite de artículos o añade filtros'
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: 'Proxy error', 
      details: String(error) 
    });
  }
};