// api/users.js - Proxy para gestión de usuarios
const API_BASE_URL = 'http://49.12.239.163:3002';

export default async function handler(req, res) {
  const { method, headers, body } = req;

  // Obtener token de autorización
  const token = headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de autorización requerido'
    });
  }

  try {
    let url = `${API_BASE_URL}/api/users`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    };

    // Manejar diferentes métodos HTTP
    if (method === 'GET') {
      // GET /api/users o GET /api/users/:id
      if (req.query.id) {
        url = `${API_BASE_URL}/api/users/${req.query.id}`;
      }
    } else if (method === 'POST') {
      // POST /api/users - Crear usuario
      options.body = JSON.stringify(body);
    } else if (method === 'PUT') {
      // PUT /api/users/:id - Actualizar usuario
      // PUT /api/users/:id/password - Cambiar contraseña
      if (req.query.id) {
        if (req.query.action === 'password') {
          url = `${API_BASE_URL}/api/users/${req.query.id}/password`;
        } else {
          url = `${API_BASE_URL}/api/users/${req.query.id}`;
        }
        options.body = JSON.stringify(body);
      } else {
        return res.status(400).json({
          success: false,
          error: 'ID de usuario requerido para actualizar'
        });
      }
    } else if (method === 'DELETE') {
      // DELETE /api/users/:id - Eliminar usuario
      if (req.query.id) {
        url = `${API_BASE_URL}/api/users/${req.query.id}`;
      } else {
        return res.status(400).json({
          success: false,
          error: 'ID de usuario requerido para eliminar'
        });
      }
    } else {
      return res.status(405).json({
        success: false,
        error: 'Método no permitido'
      });
    }

    // Hacer la petición al backend
    const response = await fetch(url, options);
    const data = await response.json();

    // Devolver la respuesta del backend
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Error en proxy de usuarios:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al comunicarse con el servidor'
    });
  }
}