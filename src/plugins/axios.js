// src/plugins/axios.js

// --- Función Auxiliar para leer el valor de una cookie ---
function getCookieValue(cookieName) {
    const name = cookieName + "=";
    // Decodificamos por si hay caracteres especiales
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return ""; // Retorna vacío si no la encuentra
  }
  // --- Fin Función Auxiliar ---
  
  import axios from 'axios';
  
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN', // Dejamos esto por si acaso
    xsrfHeaderName: 'X-XSRF-TOKEN', // Dejamos esto por si acaso
  });
  
  // --- AÑADIR/DESCOMENTAR EL INTERCEPTOR DE PETICIÓN ---
  axiosInstance.interceptors.request.use(config => {
    // Obtener el token de la cookie ANTES de cada petición
    const xsrfToken = getCookieValue('XSRF-TOKEN');
  
    if (xsrfToken) {
      // Si encontramos el token, lo añadimos manualmente a las cabeceras de la petición
      // console.log('Interceptor: Añadiendo X-XSRF-TOKEN', xsrfToken); // Útil para debug
      config.headers['X-XSRF-TOKEN'] = xsrfToken;
    } else {
      // console.warn('Interceptor: Cookie XSRF-TOKEN no encontrada.'); // Útil para debug
    }
    // Devolvemos la configuración modificada (o sin modificar si no había token)
    return config;
  }, error => {
    // Manejar errores en la configuración de la petición
    return Promise.reject(error);
  });
  // --- Fin Interceptor ---
  
  
  // (Otros interceptores opcionales de respuesta irían aquí)
  
  
  export default axiosInstance;