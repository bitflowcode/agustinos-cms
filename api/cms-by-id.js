// api/cms-by-id.js — Manejo de operaciones por ID sin rutas dinámicas
module.exports = async (req, res) => {
  // Extraer ID de los query parameters
  const { id } = req.query || {};
  
  // Logging para diagnóstico
  console.log('[cms-by-id] Request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    id,
    headers: {
      authorization: req.headers.authorization ? 'present' : 'missing',
      contentType: req.headers['content-type']
    }
  });

  // CORS básico
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Validar que tenemos un ID
  if (!id) {
    return res.status(400).json({ success: false, error: 'ID de artículo requerido' });
  }

  // Validar método
  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  const BACKEND_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.CMS_BACKEND ||
    'http://49.12.239.163:3002';

  const urlStr = req.url || '';
  const search = urlStr.includes('?') ? urlStr.slice(urlStr.indexOf('?')) : '';

  const candidates = [
    `${BACKEND_BASE}/api/articles/cms/${id}${search}`,
    `${BACKEND_BASE}/api/articles/${id}${search}`,
  ];

  try {
    let upstream, lastText = '';
    for (const url of candidates) {
      console.log(`[cms-by-id] Trying: ${req.method} ${url}`);
      
      upstream = await fetch(url, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
        },
        body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
      });
      
      console.log(`[cms-by-id] Response: ${upstream.status} from ${url}`);
      
      // Si 2xx/4xx devolvemos tal cual; si 5xx probamos el siguiente candidato
      if (upstream.ok || upstream.status < 500) break;
      lastText = await upstream.text().catch(() => '');
    }

    const status = upstream.status;
    const ct = upstream.headers.get('content-type') || '';

    if (!ct.includes('application/json')) {
      const text = lastText || (await upstream.text().catch(() => ''));
      console.log(`[cms-by-id] Non-JSON response: ${text.substring(0, 100)}...`);
      return res.status(status).send(text);
    }

    const json = await upstream.json().catch(() => null);
    if (!json) {
      return res.status(status).json({ success: false, error: 'Invalid JSON from upstream' });
    }

    // Normaliza si hace falta
    if (Object.prototype.hasOwnProperty.call(json, 'success')) {
      return res.status(status).json(json);
    } else {
      return res.status(status).json({ success: status >= 200 && status < 300, data: json });
    }
  } catch (error) {
    console.error('[cms-by-id] Proxy error:', error);
    return res.status(500).json({ success: false, error: 'Proxy error', details: String(error) });
  }
};
