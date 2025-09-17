// api/upload-video.js - Proxy de subida de vídeo (Vercel → Backend Hetzner)
// - Mantiene streaming (bodyParser: false)
// - Convierte la llamada POST del CMS en un PUT al backend con ?token=...
// - Ajusta el límite de tamaño (opcional) y pasa headers necesarios
// - Usa dominio/puerto del backend desde ENV si está disponible

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE /* p.ej. https://api.appagustinos.es */ ||
  process.env.UPLOAD_BACKEND       /* fallback alternativo si lo defines */   ||
  'http://49.12.239.163:3002';     /* fallback por IP/puerto */

export default async function handler(req, res) {
  // CORS básico (si lo usas desde otros orígenes); si todo es same-origin, puedes quitarlo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.query.token || '';
    if (!token) {
      return res.status(400).json({ success: false, error: 'Missing token in query string' });
    }

    // (Opcional) Verificación de tamaño. Ajusta o elimina si no quieres cortar aquí.
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const MAX_BYTES = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES || 2 * 1024 * 1024 * 1024); // 2GB por defecto
    if (contentLength && contentLength > MAX_BYTES) {
      return res.status(413).json({
        success: false,
        error: 'Archivo muy grande',
        maxSize: `${Math.round(MAX_BYTES / (1024 * 1024))}MB`,
        receivedSize: `${Math.round((contentLength / (1024 * 1024)) * 100) / 100}MB`,
      });
    }

    // Proxy al backend real con PUT + token en query, manteniendo el stream del body
    const upstreamUrl = `${BACKEND_BASE}/api/upload/video?token=${encodeURIComponent(token)}`;

    const response = await fetch(upstreamUrl, {
      method: 'PUT',
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': req.headers['content-type'] || 'application/octet-stream',
        // Pasamos Content-Length si está presente; algunos navegadores no lo envían
        ...(req.headers['content-length'] ? { 'Content-Length': req.headers['content-length'] } : {}),
      },
      body: req,   // Stream directo del request
      // Node.js streaming hint (necesario en runtimes Node 18+)
      duplex: 'half',
    });

    // Copiamos status y devolvemos JSON o texto según corresponda
    const ct = response.headers.get('content-type') || '';
    res.status(response.status);
    if (ct.includes('application/json')) {
      const data = await response.json().catch(() => null);
      return res.json(data ?? { success: false, error: 'Invalid JSON from upstream' });
    } else {
      const text = await response.text().catch(() => '');
      return res.send(text);
    }
  } catch (error) {
    console.error('[UPLOAD PROXY] Error:', error);
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'Cannot connect to backend server',
        details: 'Backend server is not reachable',
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Proxy error',
      details: error?.message || String(error),
    });
  }
}