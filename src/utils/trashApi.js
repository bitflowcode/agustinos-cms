import api from './api';

// Obtener artículos en papelera
export const getTrashArticles = async () => {
  try {
    const response = await api.get('/trash-all');
    return response.data;
  } catch (error) {
    console.error('Error al obtener papelera:', error);
    throw error;
  }
};

// Mover artículo a papelera (soft delete)
export const moveToTrash = async (articleId) => {
  try {
    const response = await api.put(`/trash-all?id=${articleId}&action=soft-delete`);
    return response.data;
  } catch (error) {
    console.error('Error al mover a papelera:', error);
    throw error;
  }
};

// Restaurar artículo de papelera
export const restoreArticle = async (articleId) => {
  try {
    const response = await api.put(`/trash-all?id=${articleId}&action=restore`);
    return response.data;
  } catch (error) {
    console.error('Error al restaurar artículo:', error);
    throw error;
  }
};

// Eliminar permanentemente
export const deletePermanently = async (articleId) => {
  try {
    const response = await api.delete(`/trash-all?id=${articleId}&action=permanent`);
    return response.data;
  } catch (error) {
    console.error('Error al eliminar permanentemente:', error);
    throw error;
  }
};