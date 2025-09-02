import axios from 'axios';

// Configuración base de la API
const API_BASE_URL = 'https://agustinos-cms.vercel.app/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('cms_token');
      localStorage.removeItem('cms_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Funciones de autenticación
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/login', { username, password });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/me');
    return response.data;
  },
};

// Funciones de artículos
export const articlesAPI = {
  getSections: async () => {
    const response = await api.get('/sections');
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/stats');
    return response.data;
  },
  
  // CMS - Obtener lista de artículos
  getArticles: async (section = null) => {
    let url = '/cms';
    
    // Agregar parámetro section si se especifica
    if (section) {
      url += `?section=${encodeURIComponent(section)}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },
  
  // CMS - Crear nuevo artículo
  createArticle: async (articleData) => {
    const response = await api.post('/cms', articleData);
    return response.data;
  },
  
  // CMS - Obtener artículo por ID para editar
  getArticleById: async (id) => {
    const response = await api.get(`/cms/${id}`);
    return response.data;
  },
  
  // CMS - Actualizar artículo
  updateArticle: async (id, articleData) => {
    const response = await api.put(`/cms/${id}`, articleData);
    return response.data;
  },
  
  // CMS - Eliminar artículo
  deleteArticle: async (id) => {
    const response = await api.delete(`/cms/${id}`);
    return response.data;
  },
};

export default api;