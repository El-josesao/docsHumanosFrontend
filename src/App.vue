<script setup>
// --- Importaciones ---
import { ref, computed, onMounted } from 'vue'; // Importar ref y computed
import { RouterView, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
// Componentes PrimeVue
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import Menubar from 'primevue/menubar'; // <-- 1. Importar Menubar

// --- Instancias ---
const authStore = useAuthStore();
const router = useRouter(); // Router ya no se usa para navegar desde aquí, pero puede ser útil para otras cosas

// --- Lógica del Ciclo de Vida ---
onMounted(() => {
  console.log('App.vue: Componente montado, llamando a checkAuthStatus...');
  if (!authStore.isLoggedIn) {
      authStore.checkAuthStatus();
  }
});

// --- Definición de los items del Menú ---
// Usamos 'computed' para que reaccione si el estado de login cambia
// En App.vue, dentro de computed para menuItems
const menuItems = computed(() => {
  if (authStore.isLoggedIn) {
    return [
      {
        label: 'Crear Hoja',
        icon: 'pi pi-file-plus',
        // to: { name: 'CrearHoja' } // Comentado o eliminado
        command: () => { // <-- Usar command
            console.log('Navegando a CrearHoja...'); // Log para ver si se ejecuta
            router.push({ name: 'CrearHoja' }); 
        }
      },
      {
        label: 'Ver Lista',
        icon: 'pi pi-list',
        // to: { name: 'ListarHojas' } // Comentado o eliminado
        command: () => { // <-- Usar command
            console.log('Navegando a ListarHojas...'); // Log para ver si se ejecuta
            router.push({ name: 'ListarHojas' });
        }
      },
      {
        label: 'Configuración',
        icon: 'pi pi-cog',
        // to: { name: 'AdminConfig' } // Comentado o eliminado
        command: () => { // <-- Usar command
            console.log('Navegando a AdminConfig...'); // Log para ver si se ejecuta
            router.push({ name: 'AdminConfig' });
        }
      }
    ];
  } else {
    return [];
  }
});


// --- Métodos ---
const handleLogout = async () => {
    console.log('App.vue: Botón logout presionado...');
    await authStore.logout();
}

// La función navigateTo ya no es necesaria para los items del menú
</script>

<template>
  <Toast position="top-right" />

  <div id="app-container">

    <Menubar :model="menuItems" class="app-menubar p-px-3 p-py-1">
      <template #start>
        <h4 class="p-m-0 p-mr-3">Mi Aplicación</h4> </template>

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
}

/* Ajustar el estilo del Menubar si es necesario */
/* El Menubar ya tiene su propio fondo y estructura, puede que no necesites .app-header */
.app-menubar {
  border-radius: 0; /* Para que ocupe todo el ancho sin bordes redondeados */
  border-bottom: 1px solid var(--p-surface-300);
  background-color: var(--p-surface-100); /* O el color que prefieras */
}

/* Los estilos para .nav-links y sus botones ya no son necesarios */

.user-info {
  /* Estilos adicionales si son necesarios */
}

.welcome-user {
    color: var(--p-text-color-secondary);
    font-size: 0.9em;
    white-space: nowrap; /* Evitar que el nombre se parta en dos líneas */
}

.app-main-content {
  flex-grow: 1;
  padding: 1.5rem;
  background-color: var(--p-surface-0);
}

/* Asegurarse de que los items del menú usen el color primario (si no lo hacen por defecto) */
/* Puede que no sea necesario si el tema se aplica bien */
:deep(.p-menubar .p-menuitem-link) {
    /* color: var(--p-primary-color); */ /* Descomentar si es necesario */
}

/* Estilo opcional para el item activo */
:deep(.p-menubar .p-menuitem.p-highlight > .p-menuitem-link) {
    background-color: var(--p-highlight-background);
    color: var(--p-highlight-color); /* Asegurar contraste */
}


</style>