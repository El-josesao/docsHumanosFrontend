<script setup>
// --- Importaciones ---
import { ref, computed, onMounted } from 'vue'; // Importar ref y computed
import { RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// Componentes PrimeVue
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Menubar from 'primevue/menubar'; // <-- Menubar ya está importado

// --- Instancias ---
const authStore = useAuthStore();
const router = useRouter(); 

// --- Lógica del Ciclo de Vida ---
onMounted(() => {
  console.log('App.vue: Componente montado, llamando a checkAuthStatus...');
  if (!authStore.isLoggedIn) {
      authStore.checkAuthStatus();
  }
});

// --- Definición de los items del Menú ---
const menuItems = computed(() => {
  if (authStore.isLoggedIn) {
    return [
      {
        label: 'Crear Hoja',
        icon: 'pi pi-file-plus',
        command: () => { 
            router.push({ name: 'CrearHoja' }); 
        }
      },
      {
        label: 'Ver Lista',
        icon: 'pi pi-list',
        command: () => { 
            router.push({ name: 'ListarHojas' });
        }
      },
      // --- NUEVO ENLACE A NOTAS BUENAS ---
      {
        label: 'Notas Buenas', // Etiqueta para el menú
        icon: 'pi pi-star',    // Icono sugerido (puedes cambiarlo)
        command: () => {
            router.push({ name: 'ListarNotasBuenas' }); // Navega a la vista de lista
        }
      },
      // --- FIN NUEVO ENLACE ---
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        command: () => { 
            router.push({ name: 'AdminConfig' });
        }
      }
    ];
  } else {
    return []; // No mostrar items si no está logueado
  }
});


// --- Métodos ---
const handleLogout = async () => {
    console.log('App.vue: Botón logout presionado...');
    await authStore.logout();
}

</script>

<template>
  <Toast position="top-right" />

  <div id="app-container">

    <Menubar :model="menuItems" class="app-menubar p-px-3 p-py-1">
      <template #start>
        <img alt="logo" src="/vite.svg" height="40" class="mr-2" @click="() => router.push('/')" style="cursor:pointer;" />
        <h4 class="p-m-0 p-mr-3" @click="() => router.push('/')" style="cursor:pointer;">Docs Humanos</h4>
      </template>

      <template #end>
        <div v-if="authStore.isLoggedIn" class="user-info p-d-flex p-ai-center">
          <span v-if="authStore.currentUser" class="welcome-user p-mr-2">
            {{ authStore.currentUser.name || authStore.currentUser.email }}
          </span>
          <Button
            label="Logout"
            icon="pi pi-sign-out"
            class="p-button-danger p-button-sm p-button-text" 
            @click="handleLogout"
            /> 
            </div>
         <div v-else>
             <Button
                 v-if="router.currentRoute.value.name !== 'Login'"
                 label="Login"
                 icon="pi pi-sign-in"
                 class="p-button-text"
                 @click="() => router.push({ name: 'Login' })" 
                 />
                 </div>
      </template>
    </Menubar>
    
    <main class="app-main-content">
      <RouterView />
    </main>

  </div>
</template>

<style scoped>
#app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--p-surface-ground); /* Un fondo general para la app */
}

.app-menubar {
  border-radius: 0; 
  border-bottom: 1px solid var(--p-surface-border); /* Usar variables de tema de PrimeVue */
  background-color: var(--p-surface-card); /* Fondo para la barra de menú */
  padding: 0.5rem 1rem; /* Ajustar padding si es necesario */
}

.app-menubar .p-menubar-start h4,
.app-menubar .p-menubar-start img {
    margin-right: 0.5rem; /* Espacio entre logo/título y los items */
}


.user-info {
  /* Estilos adicionales si son necesarios */
}

.welcome-user {
    color: var(--p-text-color-secondary);
    font-size: 0.9em;
    white-space: nowrap; 
}

.app-main-content {
  flex-grow: 1;
  padding: 1.5rem; /* Espacio alrededor del contenido principal */
}

/* Estilo para los items del menú para que se vean más como botones/enlaces */
:deep(.p-menubar .p-menuitem > .p-menuitem-content > .p-menuitem-link) {
    padding: 0.75rem 1rem;
    transition: background-color 0.2s;
}
:deep(.p-menubar .p-menuitem > .p-menuitem-content > .p-menuitem-link:hover) {
    background-color: var(--p-surface-hover);
}

/* Estilo opcional para el item activo */
:deep(.p-menubar .p-menuitem.p-highlight > .p-menuitem-content > .p-menuitem-link) {
    background-color: var(--p-highlight-background);
    color: var(--p-highlight-color);
}

:deep(.p-menubar .p-menuitem.p-highlight > .p-menuitem-content > .p-menuitem-link .p-menuitem-text),
:deep(.p-menubar .p-menuitem.p-highlight > .p-menuitem-content > .p-menuitem-link .p-menuitem-icon) {
    color: var(--p-highlight-color); /* Asegurar que el texto e icono también cambien */
}

</style>