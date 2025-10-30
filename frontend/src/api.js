// api.js - VERIFICAR QUE ESTÉ CONFIGURADO CORRECTAMENTE
import axios from 'axios';
import { getToken, logout } from './auth';

const api = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 10000,
});

// ✅ INTERCEPTOR PARA AGREGAR EL TOKEN AUTOMÁTICAMENTE
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ INTERCEPTOR PARA MANEJAR ERRORES 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ Token expirado o inválido, cerrando sesión...');
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;