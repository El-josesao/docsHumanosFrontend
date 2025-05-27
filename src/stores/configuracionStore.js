// src/stores/configuracionStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import apiClient from '@/plugins/axios'; // Asumiendo que tienes tu instancia de axios configurada así

export const useConfiguracionStore = defineStore('configuracion', () => {
  const globalConfig = ref(null);
  const loading = ref(false);
  const error = ref(null);

  async function fetchConfiguracion() {
    // Quitamos la condición de cargar solo una vez para las pruebas, o la ajustamos:
    // if (globalConfig.value && !forceRefresh) return; 
    console.log('ConfiguracionStore: Intentando fetchConfiguracion...'); // Log aquí

    loading.value = true;
    error.value = null;
    try {
      // Asegúrate que la URL sea la correcta y que apiClient (o axios) esté bien configurado
      const response = await apiClient.get('/configuracion'); // Sin /api/ si ya está en baseURL
      globalConfig.value = response.data;
      console.log('ConfiguracionStore: Configuración global cargada:', response.data); // Log aquí
    } catch (err) {
      console.error('ConfiguracionStore: Error fetching global configuration:', err);
      error.value = 'No se pudo cargar la configuración global.';
      if (err.response) {
        console.error('ConfiguracionStore: Error response data:', err.response.data);
        console.error('ConfiguracionStore: Error response status:', err.response.status);
      }
    } finally {
      loading.value = false;
    }
  }

  const jefeRhPredeterminadoId = computed(() => {
    const id = globalConfig.value?.jefe_rh_predeterminado_id || null;
    console.log('ConfiguracionStore: jefeRhPredeterminadoId computed:', id); // Log aquí
    return id;
  });

  const hojaMembretadaUrl = computed(() => {
    return globalConfig.value?.hoja_membretada_url || null;
  });

  return {
    globalConfig,
    loading,
    error,
    fetchConfiguracion,
    jefeRhPredeterminadoId,
    hojaMembretadaUrl,
  };
});