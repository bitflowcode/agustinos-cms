// api/login.js - Proxy específico para login
export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  try {
    console.log('[PROXY] POST /api/auth/login');
    console.log('[PROXY] Body:', req.body);

    // Hacer request al servidor
    const response = await fetch('http://49.12.239.163:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    console.log('[PROXY] Response:', data);

    res.status(response.status).json(data);

  } catch (error) {
    console.error('[PROXY] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
