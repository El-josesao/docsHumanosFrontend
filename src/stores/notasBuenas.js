// src/stores/notasBuenas.js
import { defineStore } from 'pinia';
import axiosInstance from '@/plugins/axios.js';
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';


export const useNotasBuenasStore = defineStore('notasBuenas', () => {
    const notas = ref([]);
    const loading = ref(false);
    const error = ref(null);

    async function fetchNotasBuenas() {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.get('/api/notas-buenas');
            notas.value = response.data.data; // Asumiendo paginación de Laravel
        } catch (e) {
            error.value = 'Error al cargar las notas buenas.';
            console.error(e);
        } finally {
            loading.value = false;
        }
    }

    async function createNotaBuena(notaData) {
        loading.value = true;
        error.value = null;
        try {
            const response = await axiosInstance.post('/api/notas-buenas', notaData);
            // Añadir la nueva nota al inicio de la lista local
            notas.value.unshift(response.data);
            return response.data; // Devolver la nota creada
        } catch (e) {
            error.value = e.response?.data?.message || 'Ocurrió un error al crear la nota.';
            console.error(e);
            throw error.value; // Lanzar error para que el componente lo maneje
        } finally {
            loading.value = false;
        }
    }
    async function downloadPdf(notaId) {
        try {
            const response = await axiosInstance.get(`/api/notas-buenas/${notaId}/pdf`, {
                responseType: 'blob',
            });
            
            // Lógica para ABRIR EN NUEVA PESTAÑA
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = window.URL.createObjectURL(blob);
            window.open(pdfUrl, '_blank'); // Abre en una nueva pestaña
            setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 100); // Limpia la URL después de un momento

            return { success: true };

        } catch (e) {
            console.error('Error al descargar el PDF:', e);
            // ... (el manejo de errores puede seguir igual)
            let errorMessage = 'No se pudo generar el PDF.';
            if (e.response && e.response.data.type === 'application/json') {
                try {
                    const errorText = await e.response.data.text();
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (parseError) {}
            }
            throw new Error(errorMessage);
        }
    }

    return { notas, loading, error, fetchNotasBuenas, createNotaBuena, downloadPdf };
});