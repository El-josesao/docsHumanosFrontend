// src/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from '@/stores/auth';
// --- Component Imports ---
import HojaServicioForm from "../components/HojaServicioForm.vue";
import LoginPage from "../views/LoginPage.vue";

// --- Definición de Rutas ---
const routes = [
  // RUTA LOGIN (PÚBLICA)
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { requiresAuth: false },
  },
  // RUTA CREAR (PROTEGIDA)
  {
    path: "/",
    name: "CrearHoja",
    component: HojaServicioForm,
    meta: { requiresAuth: true },
  },
  // RUTA LISTA (PROTEGIDA)
  {
    path: "/lista",
    name: "ListarHojas",
    component: () =>
      import(
        /* webpackChunkName: "lista-hojas" */ "../components/ListaHojasServicio.vue"
      ),
    meta: { requiresAuth: true },
  },
  // RUTA EDITAR (PROTEGIDA)
  {
    path: "/editar/:hojaId",
    name: "EditarHoja",
    component: HojaServicioForm,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/configuracion",
    name: "AdminConfig",
    // Asegúrate que la ruta al componente sea correcta
    component: () => import('../components/AdminConfig.vue'), 
    meta: { requiresAuth: true },
  },
  // RUTA CONFIGURACIÓN (PROTEGIDA)
  {
    path: "/configuracion",
    name: "AdminConfig",
    component: () =>
      import(
        /* webpackChunkName: "admin-config" */ "../components/AdminConfig.vue"
      ),
    meta: { requiresAuth: true },
  },
];

// --- Creación del Router ---
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});



// --- NUEVO GUARDIÁN DE NAVEGACIÓN CON FIREBASE AUTH ---
// --- NUEVO GUARDIÁN DE NAVEGACIÓN CON PINIA/SANCTUM ---

router.beforeEach((to, from, next) => { // Ya no necesita ser async aquí generalmente
  const authStore = useAuthStore(); // Obtener instancia del store de Pinia

  // La verificación inicial de sesión (`checkAuthStatus`) se dispara
  // desde App.vue cuando la aplicación se monta.
  // Este guardián simplemente reacciona al estado ACTUAL del store.

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const isLoginPage = to.name === 'Login';
  const isLoggedIn = authStore.isLoggedIn; // Leemos el estado actual del store

  console.log(
    `Router Guard: To=${to.path}, RequiresAuth=${requiresAuth}, IsLoggedIn=${isLoggedIn}`
  );

  if (requiresAuth && !isLoggedIn) {
    // --- CASO 1: Ruta protegida y NO logueado ---
    // Redirigir a Login. Guardamos la ruta original en 'query.redirect'
    // para poder volver a ella después de un login exitoso.
    console.log(`Router Guard: Acceso DENEGADO a ${to.path}. Redirigiendo a Login.`);
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (isLoginPage && isLoggedIn) {
    // --- CASO 2: Intenta acceder a Login PERO YA está logueado ---
    // Redirigir a una página principal para usuarios logueados (ej. la lista)
    console.log(`Router Guard: Usuario ya logueado. Redirigiendo desde Login a /lista.`);
    next({ path: '/lista' }); // Cambia '/lista' si tu página principal es otra (ej. '/')
  } else {
    // --- CASO 3: Ruta pública O (Ruta protegida Y SÍ logueado) ---
    // Permitir el acceso
    console.log(`Router Guard: Acceso PERMITIDO a ${to.path}.`);
    next();
  }
});
// --- FIN NUEVO GUARDIÁN ---
// --- FIN NUEVO GUARDIÁN ---

export default router;
