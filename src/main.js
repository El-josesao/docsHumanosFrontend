// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import Tooltip from 'primevue/tooltip';
// --- PrimeVue ---
import PrimeVue from 'primevue/config';
import Lara from '@primevue/themes/lara';      // Importar el preset BASE Lara
import ToastService from 'primevue/toastservice';
import 'primeicons/primeicons.css'; // Importar iconos

// --- PrimeFlex ---
import 'primeflex/primeflex.css'; // Importar utilidades CSS

// --- Estilos Globales y Fuentes ---
import './assets/base.css'; // Asegúrate que este archivo exista y tenga el @import de Google Fonts

// --- Crear el Preset Personalizado (Versión Corregida con Hexadecimales) ---
const MyCustomLara = {
    ...Lara, // 1. Copiar todas las definiciones del preset Lara base
    dt: {    // 2. Acceder a los Design Tokens (dt)
        ...(Lara.dt || {}), // 3. Copiar los DT existentes de Lara (importante para no perder definiciones)

        // 4. Sobrescribir la fuente global (asegúrate que las fuentes estén en base.css)
        font: {
            family: "'Noto Sans', 'Montserrat', 'Open Sans', ui-sans-serif, system-ui, sans-serif"
        },

        // 5. Sobrescribir la paleta de color primaria usando valores HEX directos
        //    (Estos son los valores estándar para la paleta 'blue' en Lara/Tailwind)
        primary: {
             50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6', // Color primario principal
            600: '#2563eb', // Usado para hover/focus
            700: '#1d4ed8', // Usado para active/focus más intenso
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
        }
        
        // Nota: No necesitas redefinir explícitamente los colores de 'button.primary'
        // aquí, ya que deberían heredar automáticamente de la paleta 'primary' que
        // acabamos de sobrescribir. Si aún así no funcionara, se podrían añadir aquí:
        /*
        button: {
             ...(Lara.dt?.button || {}), // Copiar otros DT de botón
             primary: {
                 background: '{primary.500}',
                 hoverBackground: '{primary.600}',
                 activeBackground: '{primary.700}',
                 borderColor: '{primary.500}',
                 hoverBorderColor: '{primary.600}',
                 activeBorderColor: '{primary.700}',
                 color: '#ffffff',
                 hoverColor: '#ffffff',
                 activeColor: '#ffffff',
                 focusRing: {
                     color: '{primary.200}' // O el color que prefieras para el anillo de foco
                 }
             }
        }
        */
        // Puedes añadir más sobreescrituras de DT para otros componentes o paletas aquí
    }
};
// --- Fin Preset Personalizado ---


// --- Creación e inicialización de la App ---
const app = createApp(App);
const pinia = createPinia();
app.directive('tooltip', Tooltip);
app.use(pinia);
app.use(router);

// --- Usar el Preset Personalizado en PrimeVue ---
app.use(PrimeVue, {
    theme: {
        preset: MyCustomLara, // <-- Usar nuestro preset modificado
        options: {
            prefix: 'p',
            darkModeSelector: '.p-dark', // Opcional: selector para modo oscuro si lo usas
            cssLayer: false          // Requerido para usar presets correctamente
        }
    },
    ripple: true // Habilitar efecto ripple si lo deseas
});

// Registrar servicios necesarios
app.use(ToastService);

// Montar la aplicación
app.mount('#app');