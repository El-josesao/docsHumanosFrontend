// src/stores/auth.js
import { defineStore } from 'pinia';
// Usamos axiosInstance global por ahora, idealmente importaríamos una instancia configurada
import axiosInstance from '@/plugins/axios.js'; // <-- CORRECTO (apunta a axios.js)
import router from '@/router'; // Importamos el router para poder redirigir

// Asegúrate que la URL base esté configurada globalmente o crea una instancia de axiosInstance
// Si no está global, descomenta y ajusta la siguiente línea:
// axiosInstance.defaults.baseURL = 'http://localhost:8000'; // ¡IMPORTANTE! URL base SIN /api

export const useAuthStore = defineStore('auth', {
  // 1. Estado inicial
  state: () => ({
    isAuthenticated: false, // Flag para saber si está autenticado
    user: null,           // Objeto para guardar datos del usuario si está autenticado
  }),

  // 2. Getters (propiedades computadas)
  getters: {
    isLoggedIn: (state) => state.isAuthenticated,
    currentUser: (state) => state.user,
  },

  // 3. Actions (métodos para cambiar el estado y hacer llamadas API)
  actions: {
    // --- Mutaciones simples de estado ---
    setAuthenticated(status) {
      this.isAuthenticated = status;
    },
    setUser(userData) {
      this.user = userData;
    },
    clearAuth() {
      this.isAuthenticated = false;
      this.user = null;
    },

    // --- Acciones con API ---

    // Verifica si hay sesión válida en backend
    async checkAuthStatus() {
      // Evitamos llamadas innecesarias si ya sabemos que está autenticado
      if (this.isAuthenticated && this.user) return;

      console.log('AuthStore: Verificando estado de autenticación con /api/user...');
      try {
        // Laravel Sanctum necesita esta cookie para autenticar peticiones API
        // await axiosInstance.get('/sanctum/csrf-cookie'); // Podría ser necesario si no se obtiene antes
        const response = await axiosInstance.get('/api/user'); // Endpoint que devuelve datos del usuario si está logueado
        if (response.data) {
          this.setUser(response.data);
          this.setAuthenticated(true);
          console.log('AuthStore: Sesión válida encontrada.', response.data);
        } else {
          this.clearAuth();
        }
      } catch (error) {
        // Un error 401 o 419 aquí es normal si no hay sesión válida
        console.warn('AuthStore: No autenticado o error verificando sesión.', error.response?.status);
        this.clearAuth();
      }
    },

    // Intenta hacer login
    async login(credentials) {
      console.log('AuthStore: Intentando login...');
      // 1. Asegurar cookie CSRF (NECESARIO para Sanctum SPA con cookies)
      try {
        await axiosInstance.get('/sanctum/csrf-cookie');
        console.log('AuthStore: Cookie CSRF obtenida.');
      } catch (error) {
        console.error('AuthStore: Error obteniendo cookie CSRF', error);
        this.clearAuth(); // Limpiar estado por si acaso
        throw new Error('Error de configuración CSRF'); // Lanzar error para el componente
      }

      // 2. Intentar el login
      try {
        // Usamos la URL base configurada + /login (o la ruta que definas en Laravel)
        await axiosInstance.post('/api/login', credentials); // <-- Añadimos /api al principio // Endpoint de login de Laravel
        console.log('AuthStore: Login API exitoso.');
        // 3. Si el login fue exitoso, verificar quién es el usuario para actualizar estado
        await this.checkAuthStatus();
        return this.isAuthenticated; // Devolver true si la verificación tuvo éxito
      } catch (error) {
        console.error('AuthStore: Error en login API', error.response?.data || error.message);
        this.clearAuth();
        throw error; // Lanzar error para que el componente sepa que falló
      }
    },

    // Intenta hacer logout
    async logout() {
      console.log('AuthStore: Intentando logout...');
      try {
        // Usamos la URL base configurada + /logout (o la ruta que definas en Laravel)
        await axiosInstance.post('/api/logout'); 
        console.log('AuthStore: Logout API exitoso.');
      } catch (error) {
        console.error('AuthStore: Error en logout API', error.response?.data || error.message);
        // Continuamos igual para limpiar el estado local
      } finally {
        this.clearAuth();
        // Redirigir a la página de login después de limpiar estado
        router.push({ name: 'Login' }).catch(err => {
             // Ignorar errores de navegación si ya estamos en login, etc.
             if (err.name !== 'NavigationDuplicated' && !err.message.includes('Avoided redundant navigation')) {
                console.error('Error redirigiendo a Login:', err);
             }
        });
        console.log('AuthStore: Estado local limpiado y redirigido a Login.');
      }
    },
  },
});