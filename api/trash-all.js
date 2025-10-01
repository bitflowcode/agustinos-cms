const API_BASE_URL = 'http://49.12.239.163:3002/api';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { authorization } = req.headers;

    // GET - Listar papelera (sin parámetros)
    if (req.method === 'GET') {
      const response = await fetch(`${API_BASE_URL}/articles/cms/trash`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorization || ''
        }
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    }

    // PUT/DELETE - Operaciones sobre artículos (requiere id y action)
    const { id, action } = req.query;
    
    if (!id || !action) {
      return res.status(400).json({ error: 'ID y acción requeridos para operaciones' });
    }

    let endpoint = '';
    let method = 'PUT';

    // Determinar endpoint según acción
    if (action === 'soft-delete') {
      endpoint = `${API_BASE_URL}/articles/cms/${id}/soft-delete`;
      method = 'PUT';
    } else if (action === 'restore') {
      endpoint = `${API_BASE_URL}/articles/cms/${id}/restore`;
      method = 'PUT';
    } else if (action === 'permanent') {
      endpoint = `${API_BASE_URL}/articles/cms/${id}/permanent`;
      method = 'DELETE';
    } else {
      return res.status(400).json({ error: 'Acción no válida' });
    }

    const response = await fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization || ''
      }
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Error in trash-all proxy:', error);
    return res.status(500).json({ 
      error: 'Error al procesar solicitud',
      message: error.message 
    });
  }
}