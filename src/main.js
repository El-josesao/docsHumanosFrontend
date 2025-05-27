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
import ConfirmationService from 'primevue/confirmationservice';
import 'primeicons/primeicons.css'; // Importar iconos

// --- PrimeFlex ---
import 'primeflex/primeflex.css'; // Importar utilidades CSS

// --- Estilos Globales y Fuentes ---
import './assets/base.css';

// --- Objeto de Localización en Español para PrimeVue 4 ---
const PrimeVueES = {
    startsWith: 'Comienza con',
    contains: 'Contiene',
    notContains: 'No contiene',
    endsWith: 'Termina con',
    equals: 'Igual a',
    notEquals: 'No igual a',
    noFilter: 'Sin filtro',
    lt: 'Menor que',
    lte: 'Menor o igual que',
    gt: 'Mayor que',
    gte: 'Mayor o igual que',
    dateIs: 'Fecha es',
    dateIsNot: 'Fecha no es',
    dateBefore: 'Fecha antes de',
    dateAfter: 'Fecha después de',
    clear: 'Limpiar',
    apply: 'Aplicar',
    matchAll: 'Coincidir Todos',
    matchAny: 'Coincidir Cualquiera',
    addRule: 'Añadir Regla',
    removeRule: 'Quitar Regla',
    accept: 'Sí',
    reject: 'No',
    choose: 'Elegir',
    upload: 'Subir',
    cancel: 'Cancelar',
    completed: 'Completado',
    pending: 'Pendiente',
    dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
    dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
    dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"],
    monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    chooseYear: 'Elegir Año',
    chooseMonth: 'Elegir Mes',
    chooseDate: 'Elegir Fecha',
    prevDecade: 'Década Anterior',
    nextDecade: 'Década Siguiente',
    prevYear: 'Año Anterior',
    nextYear: 'Año Siguiente',
    prevMonth: 'Mes Anterior',
    nextMonth: 'Mes Siguiente',
    prevHour: 'Hora Anterior',
    nextHour: 'Hora Siguiente',
    prevMinute: 'Minuto Anterior',
    nextMinute: 'Minuto Siguiente',
    prevSecond: 'Segundo Anterior',
    nextSecond: 'Segundo Siguiente',
    am: 'am',
    pm: 'pm',
    today: 'Hoy',
    weekHeader: 'Sem',
    firstDayOfWeek: 1, // Lunes como primer día
    dateFormat: 'dd/mm/yy', // Formato de fecha por defecto para el input del calendario
    weak: 'Débil',
    medium: 'Medio',
    strong: 'Fuerte',
    passwordPrompt: 'Escriba una contraseña',
    emptyFilterMessage: 'No se encontraron resultados',
    searchMessage: '{0} resultados disponibles',
    selectionMessage: '{0} elementos seleccionados',
    emptySelectionMessage: 'Ningún elemento seleccionado',
    emptySearchMessage: 'No se encontraron resultados',
    emptyMessage: 'No hay opciones disponibles',
    aria: {
        trueLabel: 'Verdadero',
        falseLabel: 'Falso',
        nullLabel: 'No seleccionado',
        star: '1 estrella',
        stars: '{star} estrellas',
        selectAll: 'Todos los elementos seleccionados',
        unselectAll: 'Todos los elementos deseleccionados',
        close: 'Cerrar',
        previous: 'Anterior',
        next: 'Siguiente',
        navigation: 'Navegación',
        scrollTop: 'Desplazarse hacia Arriba',
        moveTop: 'Mover Arriba',
        moveUp: 'Subir',
        moveDown: 'Bajar',
        moveBottom: 'Mover Abajo',
        moveToTarget: 'Mover a Destino',
        moveAllToTarget: 'Mover Todo a Destino',
        moveToSource: 'Mover a Origen',
        moveAllToSource: 'Mover Todo a Origen',
        pageLabel: 'Página {page}',
        firstPageLabel: 'Primera Página',
        lastPageLabel: 'Última Página',
        nextPageLabel: 'Siguiente Página',
        previousPageLabel: 'Página Anterior',
        rowsPerPageLabel: 'Filas por página',
        jumpToPageDropdownLabel: 'Saltar a Página Dropdown',
        jumpToPageInputLabel: 'Saltar a Página Input',
        selectRow: 'Fila Seleccionada',
        unselectRow: 'Fila Deseleccionada',
        expandRow: 'Expandir Fila',
        collapseRow: 'Contraer Fila',
        showFilterMenu: 'Mostrar Menú de Filtro',
        hideFilterMenu: 'Ocultar Menú de Filtro',
        filterOperator: 'Operador de Filtro',
        filterConstraint: 'Restricción de Filtro',
        editRow: 'Editar Fila',
        saveEdit: 'Guardar Edición',
        cancelEdit: 'Cancelar Edición',
        listView: 'Vista de Lista',
        gridView: 'Vista de Cuadrícula',
        slide: 'Deslizar',
        slideNumber: '{slideNumber}',
        zoomImage: 'Ampliar Imagen',
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        rotateRight: 'Girar Derecha',
        rotateLeft: 'Girar Izquierda'
    }
};
// --- Fin Objeto de Localización ---

// --- Crear el Preset Personalizado ---
const MyCustomLara = {
    ...Lara,
    dt: {
        ...(Lara.dt || {}),
        font: {
            family: "'Noto Sans', 'Montserrat', 'Open Sans', ui-sans-serif, system-ui, sans-serif"
        },
        primary: {
             50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
        }
    }
};
// --- Fin Preset Personalizado ---


// --- Creación e inicialización de la App ---
const app = createApp(App);
const pinia = createPinia();

app.directive('tooltip', Tooltip);
app.use(pinia);
app.use(router);

// --- Usar el Preset Personalizado y la Localización en PrimeVue ---
app.use(PrimeVue, {
    theme: {
        preset: MyCustomLara,
        options: {
            prefix: 'p',
            darkModeSelector: '.p-dark',
            cssLayer: false // Importante para que el preset funcione bien
        }
    },
    ripple: true,
    locale: PrimeVueES // <--- ¡CONFIGURACIÓN DEL IDIOMA GLOBAL PARA PRIMEVUE!
});

// Registrar servicios necesarios
app.use(ToastService);
app.use(ConfirmationService);

// Montar la aplicación
app.mount('#app');