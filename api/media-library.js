// api/media-library.js — Proxy para galería de medios
module.exports = async (req, res) => {
  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const BACKEND_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.CMS_BACKEND ||
    'http://49.12.239.163:3002';

  const urlStr = req.url || '';
  const search = urlStr.includes('?') ? urlStr.slice(urlStr.indexOf('?')) : '';
  
  const url = `${BACKEND_BASE}/api/media/list${search}`;

  try {
    console.log('[media-library] Fetching:', url);

    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
    });

    console.log(`[media-library] Response status: ${upstream.status}`);

    const ct = upstream.headers.get('content-type') || '';

    if (!ct.includes('application/json')) {
      const text = await upstream.text().catch(() => '');
      return res.status(upstream.status).send(text);
    }

    const json = await upstream.json().catch(() => null);
    
    if (!json) {
      return res.status(upstream.status).json({ 
        success: false, 
        error: 'Invalid JSON from upstream' 
      });
    }

    return res.status(upstream.status).json(json);

  } catch (error) {
    console.error('[media-library] Proxy error:', error);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Error al obtener galería de medios', 
      details: error.message 
    });
  }
};

