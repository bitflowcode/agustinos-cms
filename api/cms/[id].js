// api/cms/[id].js — Proxy del CMS hacia el backend (GET/PUT/DELETE de un artículo)
// CommonJS para Vercel Functions en proyectos que no son Next.
// - GET: intenta /api/articles/cms/:id y si no, /api/articles/:id
// - PUT/DELETE: intenta /api/articles/cms/:id y si no, /api/articles/:id
// Normaliza a { success: true, data } si el upstream no trae envelope.

module.exports = async (req, res) => {
  // Extraer ID de la URL si req.query no está disponible
  const { id } = req.query || {};
  const urlId = id || req.url?.split('/').pop()?.split('?')[0];

  // Logging para diagnóstico
  console.log('[cms/[id]] Request:', {
    method: req.method,
    url: req.url,
    query: req.query,
    id,
    urlId,
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

  const BACKEND_BASE =
    process.env.NEXT_PUBLIC_API_BASE ||
    process.env.CMS_BACKEND ||
    'http://49.12.239.163:3002';

  const urlStr = req.url || '';
  const search = urlStr.includes('?') ? urlStr.slice(urlStr.indexOf('?')) : '';

  const articleId = urlId || id;
  if (!articleId) {
    return res.status(400).json({ success: false, error: 'ID de artículo requerido' });
  }

  const candidates =
    req.method === 'GET'
      ? [
          `${BACKEND_BASE}/api/articles/cms/${articleId}${search}`,
          `${BACKEND_BASE}/api/articles/${articleId}${search}`,
        ]
      : [
          `${BACKEND_BASE}/api/articles/cms/${articleId}${search}`,
          `${BACKEND_BASE}/api/articles/${articleId}${search}`,
        ];

  try {
    let upstream, lastText = '';
    for (const url of candidates) {
      upstream = await fetch(url, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
        },
        body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {}),
      });
      // si 2xx/4xx devolvemos tal cual; si 5xx probamos el siguiente candidato
      if (upstream.ok || upstream.status < 500) break;
      lastText = await upstream.text().catch(() => '');
    }

    const status = upstream.status;
    const ct = upstream.headers.get('content-type') || '';

    if (!ct.includes('application/json')) {
      const text = lastText || (await upstream.text().catch(() => ''));
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
    console.error('[api/cms/[id]] Proxy error:', error);
    return res.status(500).json({ success: false, error: 'Proxy error', details: String(error) });
  }
};