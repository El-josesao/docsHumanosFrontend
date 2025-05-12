<script setup>
// --- Importaciones Vue y Router ---
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router'; // Para el botón Editar

// --- Importaciones Externas ---
import axiosInstance from '@/plugins/axios.js'; // Instancia Axios
import { format, parseISO } from 'date-fns';    // Para formatear fechas
import { es } from 'date-fns/locale';         // Opcional: locale español para formato

// --- Importaciones PrimeVue ---
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';     // Opcional: usar Dropdown para filtro
import DataTable from 'primevue/datatable';   // Componente DataTable
import Column from 'primevue/column';         // Componente Column
import Tag from 'primevue/tag';              // Opcional: para estados visuales
import Message from 'primevue/message';       // Para errores
import ProgressSpinner from 'primevue/progressspinner'; // Para carga

// --- Setup ---
const router = useRouter();

// --- Estado Reactivo ---
const hojasList = ref([]); // Datos de la página actual
const paginationData = ref(null); // Metadatos de paginación de Laravel
const periodosList = ref([]); // Para filtro
const selectedPeriodoIdFilter = ref(''); // Filtro seleccionado (' ' = Todos)
const loading = ref(true); // Carga general de datos
const error = ref(null); // Mensaje de error
const printingId = ref(null); // ID de la hoja que se está imprimiendo

// --- Métodos ---

// Formatea fecha AAAA-MM-DD o ISO a DD/MM/YYYY
const formatDate = (value) => {
  if (value) {
    try {
      const date = parseISO(value); // Usar parseISO para manejar ambos formatos
      return format(date, 'dd/MM/yyyy', { locale: es });
    } catch (e) {
      console.error("Error formateando fecha:", value, e);
      return value; // Devolver original si falla
    }
  }
  return '';
};

// Carga lista de periodos para el filtro
const fetchPeriodos = async () => {
  try {
    // Asume que este endpoint devuelve los necesarios (ej. activos)
    const response = await axiosInstance.get('/api/periodos');
    periodosList.value = response.data;
  } catch (err) {
    console.error("Error al obtener periodos para filtro:", err);
    error.value = "No se pudo cargar la lista de periodos.";
  }
};

// Carga las hojas de servicio paginadas y filtradas
const fetchHojas = async (page = 1) => {
  loading.value = true;
  error.value = null; // Limpiar error anterior

  const params = new URLSearchParams();
  params.append('page', page);
  if (selectedPeriodoIdFilter.value) {
    params.append('periodo_id', selectedPeriodoIdFilter.value);
  }

  try {
    const response = await axiosInstance.get(`/api/hojas?${params.toString()}`);
    hojasList.value = response.data.data || [];
    const { data, ...pagination } = response.data;
    paginationData.value = pagination;
  } catch (err) {
    console.error("Error al obtener hojas desde API Laravel:", err);
    error.value = "No se pudieron cargar las hojas de servicio.";
    if (err.response?.status === 401) error.value += " Sesión expirada.";
    hojasList.value = [];
    paginationData.value = null;
  } finally {
    loading.value = false;
  }
};

// Navega a la página de edición
const editHoja = (hojaId) => {
    router.push({ name: 'EditarHoja', params: { hojaId: hojaId } });
};

// Imprime la hoja llamando a la API PDF
const imprimirHoja = async (hojaId) => {
  if (printingId.value !== null) return; // Evitar doble clic
  printingId.value = hojaId;
  error.value = null; // Limpiar error

  try {
    const response = await axiosInstance.get(`/api/hojas/${hojaId}/pdf`, {
      responseType: 'blob', // ¡Importante!
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const pdfUrl = window.URL.createObjectURL(blob);
    window.open(pdfUrl, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 100);
  } catch (err) {
    console.error(`Error al generar/obtener PDF para Hoja ID ${hojaId}:`, err);
    error.value = "Error al generar el PDF.";
    // Intentar mostrar mensaje de error del backend si no es blob
    if (err.response && err.response.data && !(err.response.data instanceof Blob)) {
         try {
             const errorText = await err.response.data.text();
             const errorJson = JSON.parse(errorText);
             error.value = errorJson.message || error.value;
         } catch (parseError) { /* Ignorar */ }
    }
  } finally {
    printingId.value = null;
  }
};

// Cambia de página de resultados (paginación manual)
const changePage = (url) => {
    if (!url) return;
    try {
        const urlParams = new URL(url).searchParams;
        const page = urlParams.get('page');
        if (page) {
            fetchHojas(page);
        }
    } catch(e) {
        console.error("Error parsing pagination URL:", e);
    }
};

// Filtra por periodo y va a la página 1
const filterByPeriodo = () => {
  fetchHojas(1);
};

// --- Ciclo de Vida ---
onMounted(() => {
  // Poner loading a true al inicio
  loading.value = true;
  error.value = null;
  // Cargar periodos y la primera página de hojas
  Promise.all([fetchPeriodos(), fetchHojas()])
         .catch((e) => console.error("Error en carga inicial onMounted", e))
         .finally(() => loading.value = false); // Quitar loading general al terminar ambas
});

// --- Observadores ---
// Podríamos usar watch para filtrar automáticamente al cambiar el dropdown
// watch(selectedPeriodoIdFilter, filterByPeriodo);

</script>

<template>
  <div class="lista-hojas-servicio p-p-3"> <h2 class="p-mb-3">Lista de Hojas de Servicio</h2>

    <div class="filter-section p-mb-4">
      <label for="filtro-periodo" class="p-mr-2">Filtrar por Periodo: </label>
      <Dropdown
            id="filtro-periodo"
            v-model="selectedPeriodoIdFilter"
            :options="periodosList"
            optionLabel="nombre"
            optionValue="id"
            placeholder="-- Todos --"
            @change="filterByPeriodo" 
            :showClear="true" 
            style="min-width: 250px;"
            :disabled="loading"
        />
      </div>

    <Message v-if="error" severity="error" :closable="true" class="p-mb-3">{{ error }}</Message>

    <DataTable
        :value="hojasList"
        :loading="loading" 
        dataKey="id"
        responsiveLayout="scroll" 
        class="p-datatable-sm" 
        stripedRows 
        >
        <template #empty> No hay hojas de servicio para mostrar con los filtros actuales. </template>
        <template #loading> Cargando datos de hojas... </template>

        <Column field="id" header="ID Hoja" :sortable="true" style="width: 8%"></Column>

        <Column field="personal.nombre" header="Trabajador" :sortable="true" style="width: 25%">
            <template #body="slotProps">
                {{ slotProps.data.personal?.nombre || 'N/A' }}
            </template>
        </Column>

        <Column field="personal.numero_tarjeta" header="No. Tarjeta" style="width: 12%">
            <template #body="slotProps">
                {{ slotProps.data.personal?.numero_tarjeta || 'N/A' }}
            </template>
        </Column>

        <Column field="periodo.nombre" header="Periodo" :sortable="true" style="width: 20%">
            <template #body="slotProps">
                 {{ slotProps.data.periodo?.nombre || 'N/A' }}
            </template>
        </Column>

        <Column field="fecha_expedicion" header="Fecha Expedición" :sortable="true" style="width: 15%">
            <template #body="slotProps">
                {{ formatDate(slotProps.data.fecha_expedicion) }}
            </template>
        </Column>

        <Column header="Acciones" headerStyle="width: 15%; text-align: center" bodyStyle="text-align: center; white-space: nowrap;">
             <template #body="slotProps">
                 <Button icon="pi pi-pencil" class="p-button-rounded p-button-success p-button-sm p-mr-1" @click="editHoja(slotProps.data.id)" v-tooltip.top="'Editar Hoja'" />
                 <Button icon="pi pi-print" class="p-button-rounded p-button-info p-button-sm" @click="imprimirHoja(slotProps.data.id)" :loading="printingId === slotProps.data.id" :disabled="printingId !== null && printingId !== slotProps.data.id" v-tooltip.top="'Imprimir PDF'" />
             </template>
        </Column>

    </DataTable>

     <div class="pagination-controls p-d-flex p-jc-between p-ai-center p-mt-3" v-if="paginationData && paginationData.last_page > 1 && !loading">
       <span class="p-text-muted">Página {{ paginationData.current_page }} de {{ paginationData.last_page }} (Total: {{ paginationData.total }})</span>
        <div>
            <Button
                @click="changePage(paginationData.prev_page_url)"
                :disabled="!paginationData.prev_page_url"
                icon="pi pi-angle-left"
                label="Anterior"
                class="p-button-sm p-button-secondary" />
            <Button
                @click="changePage(paginationData.next_page_url)"
                :disabled="!paginationData.next_page_url"
                icon="pi pi-angle-right" iconPos="right"
                label="Siguiente"
                class="p-button-sm p-button-secondary p-ml-2"/>
      </div>
    </div>

  </div>
</template>

<style scoped>
.lista-hojas-servicio {
  padding: 1rem; /* Reducir padding general si se usa Card/Panel */
}

/* Estilos para el filtro */
.filter-section {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap; /* Permitir que se envuelva en pantallas pequeñas */
  gap: 0.5rem 1rem; /* Espacio vertical y horizontal */
  align-items: center;
}
.filter-section label {
    font-weight: 500;
    margin-bottom: 0; /* Quitar margen si está en línea */
}
/* Ajustar ancho del Dropdown del filtro */
.p-dropdown {
    min-width: 200px;
    /* max-width: 300px; */
}

/* Controles de Paginación */
.pagination-controls {
    margin-top: 1.5rem;
}
.pagination-controls .p-text-muted {
    font-size: 0.9rem;
}

/* Quitar estilos de tabla HTML anteriores */
/* .hojas-table { ... } etc. */

/* Ajustes DataTable (opcional) */
:deep(.p-datatable .p-datatable-thead > tr > th) {
    background-color: #f8f9fa; /* Cabecera ligeramente diferente */
    font-weight: 600;
    text-align: center;
}
:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.6rem 0.8rem; /* Ajustar padding de celdas */
    vertical-align: middle;
}
/* Ajuste para botones de acción */
:deep(.p-button.p-button-sm) {
  margin-right: 0.25rem;
}
/* Estilo para mensaje de error */
.error-message {
  color: #d32f2f;
  background-color: #ffcdd2;
  border: 1px solid #d32f2f;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-weight: 500; /* Un poco menos fuerte */
}

/* Estilos para estado de carga */
.loading-overlay {
  /* ... */
}

</style>