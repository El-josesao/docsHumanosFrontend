<template>
  <div class="login-container">
    <Card style="width: 25em; overflow: hidden" class="p-shadow-3">
      <template #title>Iniciar Sesión</template>
      <template #content>
        <form @submit.prevent="handleLogin">
          <div class="p-fluid formgrid grid">

            <div class="field col-12">
                <Message v-if="errorMessage" severity="error" :closable="false">{{ errorMessage }}</Message>
            </div>

            <div class="field col-12">
              <FloatLabel>
                <InputText
                  id="email"
                  type="email"
                  v-model="credentials.email"
                  required
                  :disabled="isLoading"
                  :invalid="!!validationErrors.email" 
                  aria-describedby="email-error" 
                  />
                <label for="email">Correo Electrónico</label>
              </FloatLabel>
              <small id="email-error" v-if="validationErrors.email" class="p-error">{{ validationErrors.email[0] }}</small>
            </div>

            <div class="field col-12">
              <FloatLabel>
                <Password
                  id="password"
                  v-model="credentials.password"
                  required
                  :feedback="false"     
                  toggleMask           
                  inputClass="w-full"
                  :disabled="isLoading"
                  :invalid="!!validationErrors.password"
                  aria-describedby="password-error"
                  />
                <label for="password">Contraseña</label>
              </FloatLabel>
              <small id="password-error" v-if="validationErrors.password" class="p-error">{{ validationErrors.password[0] }}</small>
            </div>

            <div class="field col-12 flex justify-content-center"> 
              <Button
                type="submit"
                label="Ingresar"
                icon="pi pi-sign-in" 
                :loading="isLoading" 
                class="p-button-primary mt-3" 
              />
            </div>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// --- Importaciones de Componentes PrimeVue ---
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import FloatLabel from 'primevue/floatlabel';
import Card from 'primevue/card';
import Message from 'primevue/message';

// --- Lógica (sin cambios respecto a la versión funcional anterior) ---
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const credentials = reactive({
  email: '',
  password: '',
});
const errorMessage = ref('');
const isLoading = ref(false);
const validationErrors = ref({}); // Para errores de validación específicos

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = '';
  validationErrors.value = {}; // Limpiar errores previos

  try {
    const loggedIn = await authStore.login(credentials);
    if (loggedIn) {
      const redirectPath = route.query.redirect || '/lista';
      console.log(`Login exitoso. Redirigiendo a: ${redirectPath}`);
      // Usar replace en lugar de push si no quieres que el usuario pueda volver al login con el botón Atrás
      router.replace(redirectPath);
    } else {
      // Este caso es menos probable si el store maneja bien los errores
      errorMessage.value = 'Ocurrió un error inesperado durante el login.';
    }
  } catch (error) {
    console.error('Error en handleLogin:', error);
    if (error.response?.status === 422 && error.response.data.errors) {
      validationErrors.value = error.response.data.errors;
      errorMessage.value = error.response.data.message || "Corrige los errores.";
    } else {
      errorMessage.value = error.response?.data?.message || 'Credenciales incorrectas o error del servidor.';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
/* Estilos para centrar la Card */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  /* Ajusta min-height según necesites para centrar verticalmente */
  min-height: calc(90vh - 60px); /* Ejemplo: 90% de alto de ventana menos altura aproximada del header */
  padding: 20px;
}

/* Clases de PrimeFlex que ayudan con el espaciado/layout dentro del form */
.p-field {
  margin-bottom: 1.75rem; /* Aumentar espacio vertical entre campos */
}
.p-fluid .p-float-label {
  width: 100%;
}
/* Input dentro de FloatLabel */
:deep(.p-float-label input) {
    width: 100%;
}
/* Input dentro de Password */
:deep(.p-password input) {
    width: 100%;
}

/* Estilo para errores de validación específicos */
.p-error {
    font-size: 0.75rem; /* Hacer texto de error un poco más pequeño */
    margin-top: 4px; /* Espacio sobre el mensaje de error */
}

/* Centrar el botón */
.form-actions {
  text-align: center;
  margin-top: 20px;
}

/* Ajuste para que el componente Message no afecte tanto el layout */
:deep(.p-message) {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 1rem; /* Espacio debajo del mensaje general */
}

/* Puedes añadir estilos personalizados adicionales aquí si lo deseas */
</style>