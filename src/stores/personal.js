// src/stores/personal.js
import { defineStore } from 'pinia';
import axiosInstance from '@/plugins/axios.js';
import { ref } from 'vue';

export const usePersonalStore = defineStore('personal', () => {
    const personal = ref([]);
    const loading = ref(false);
    const error = ref(null);

    async function fetchPersonal() {
        if (personal.value.length > 0) return; // Evitar recargas innecesarias

        loading.value = true;
        error.value = null;
        try {
            // Suponiendo que tienes un endpoint que devuelve todo el personal
            const response = await axiosInstance.get('/api/personal'); 
            personal.value = response.data;
        } catch (e) {
            error.value = 'No se pudo cargar la lista de personal.';
            console.error(e);
        } finally {
            loading.value = false;
        }
    }

    return { personal, loading, error, fetchPersonal };
});