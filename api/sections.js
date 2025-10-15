// api/sections.js — Proxy para obtener secciones
module.exports = async (req, res) => {
  console.log('[sections] Request:', {
    method: req.method,
    url: req.url
  });

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const BACKEND_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.CMS_BACKEND ||
    'http://49.12.239.163:3002';

  // Función helper para fetch con timeout
  const fetchWithTimeout = (url, options, timeout = 25000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  };

  const url = `${BACKEND_BASE}/api/articles/sections`;

  try {
    console.log('[sections] Fetching:', url);
    const startTime = Date.now();

    const upstream = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
    }, 25000);

    const duration = Date.now() - startTime;
    console.log(`[sections] Response received in ${duration}ms, status: ${upstream.status}`);

    const status = upstream.status;
    const json = await upstream.json().catch(() => null);

    if (!json) {
      return res.status(status).json({ 
        success: false, 
        error: 'Invalid JSON from upstream' 
      });
    }

    return res.status(status).json(json);

  } catch (error) {
    console.error('[api/sections] Proxy error:', error);
    
    if (error.message === 'Request timeout') {
      return res.status(504).json({ 
        success: false, 
        error: 'Backend timeout',
        details: 'El servidor tardó demasiado en responder'
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: 'Proxy error', 
      details: String(error) 
    });
  }
};