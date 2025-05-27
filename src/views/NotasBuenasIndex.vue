<template>
  <div>
    <Toast />
    <div class="p-card">
      <div class="p-card-header flex justify-content-between align-items-center p-4">
        <div class="p-card-title text-2xl">Gestión de Notas Buenas</div>
        <Button label="Añadir Nota Buena" icon="pi pi-plus" @click="goToCreateForm" />
      </div>
      <div class="p-card-body">
        <DataTable :value="notasStore.notas" :loading="notasStore.loading" responsiveLayout="scroll">
          <Column field="numero_oficio" header="# Oficio"></Column>
          <Column field="personal.nombre" header="Empleado"></Column>
          <Column field="tipo_nota" header="Tipo">
             <template #body="slotProps">
                <Tag :value="slotProps.data.tipo_nota" :severity="getSeverity(slotProps.data.tipo_nota)" />
            </template>
          </Column>
          <Column field="fecha_expedicion" header="Fecha"></Column>
          <Column header="Acciones" style="width: 8rem; text-align: center;">
            <template #body="slotProps">
              <Button 
                icon="pi pi-file-pdf" 
                class="p-button-rounded p-button-danger" 
                @click="generatePdf(slotProps.data.id)" 
                v-tooltip.top="'Generar PDF'"
                :loading="pdfLoading[slotProps.data.id]" 
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'; // <--- Añadir ref
import { useRouter } from 'vue-router';
import { useNotasBuenasStore } from '@/stores/notasBuenas';

// PrimeVue
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const notasStore = useNotasBuenasStore();
const toast = useToast();

const pdfLoading = ref({}); // <--- Objeto para manejar el estado de carga por fila

onMounted(() => {
  notasStore.fetchNotasBuenas();
});

const goToCreateForm = () => {
  router.push({ name: 'CrearNotaBuena' });
};

const getSeverity = (type) => {
    return type === 'asistencia' ? 'success' : 'info';
};

// --- MÉTODO generatePdf ACTUALIZADO ---
const generatePdf = async (id) => {
    pdfLoading.value[id] = true; // Activar el loading para este botón específico
    try {
        await notasStore.downloadPdf(id);
        // El navegador se encarga de la descarga, no necesitamos toast de éxito
    } catch (error) {
        toast.add({ 
            severity: 'error', 
            summary: 'Error al generar PDF', 
            detail: error.message, // Mostrar el mensaje de error del store
            life: 5000 
        });
    } finally {
        pdfLoading.value[id] = false; // Desactivar el loading al finalizar
    }
};
</script>