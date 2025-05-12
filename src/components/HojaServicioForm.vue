<script setup>
// --- Importaciones ---
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axiosInstance from '@/plugins/axios.js';

// --- Importaciones de Componentes PrimeVue ---
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select'; // <--- ACTUALIZADO: Usar Select en lugar de Dropdown
import Calendar from 'primevue/calendar';
import Fieldset from 'primevue/fieldset';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import FloatLabel from 'primevue/floatlabel'; // Importar FloatLabel explícitamente

// --- Setup (Router, Route, ID de Hoja, Modo Edición) ---
const router = useRouter();
const route = useRoute();
const hojaId = ref(route.params.hojaId || null);
const isEditing = computed(() => !!hojaId.value);

// --- Estado Reactivo del Componente ---
const hojaData = reactive({
  personal_id: null,
  periodo_id: null,
  fecha_expedicion: new Date().toISOString().slice(0, 10),
  jefe_inmediato_id: null,
  observaciones: '',
});
const incidencias = ref([]);
const personalList = ref([]); // Contendrá objetos { id: ..., displayLabel: ..., nombre: ... }
const periodosList = ref([]); // Contendrá objetos { id: ..., nombre: ... }
const isLoadingSubmit = ref(false);
const isLoadingData = ref(false);
const errorMessage = ref('');
const validationErrors = ref({});

// --- Opciones Calculadas para Selectores ---
// No necesitan cambios, ya que Select usa las mismas props para opciones
const personalDropdownOptions = computed(() => {
  return personalList.value; // Ya tiene displayLabel
});
const tiposIncidenciaOptions = ref([
    { value: 'NB', label: 'Notas Buenas' }, { value: 'FE', label: 'Felicitaciones' },
    { value: 'NM', label: 'Nombramiento' }, { value: 'EX', label: 'Extrañamiento' },
    { value: 'AM', label: 'Amonestación' }, { value: 'SU', label: 'Suplencia' },
]);
const periodosDropdownOptions = computed(() => {
    return periodosList.value; // Asume que la API devuelve {id: ..., nombre: ...}
});

// --- Métodos (sin cambios en la lógica interna) ---

const fetchPersonal = async () => {
  try {
    const response = await axiosInstance.get('/api/personal');
    // Asegurarse que el formato sea el esperado por el computed property
    personalList.value = response.data.map(p => ({
        id: p.id,
        displayLabel: `${p.nombre} (RFC: ${p.rfc})`, // Usado por Select
        nombre: p.nombre // Dato original
    }));
  } catch (error) {
    console.error("Error fetching personal:", error);
    errorMessage.value = "No se pudo cargar la lista de personal.";
  }
};

const fetchPeriodos = async () => {
  try {
    const response = await axiosInstance.get('/api/periodos');
    periodosList.value = response.data; // Asume formato { id: ..., nombre: ... }
  } catch (error) {
    console.error("Error fetching periodos:", error);
    errorMessage.value = "No se pudo cargar la lista de periodos.";
  }
};

const fetchHojaData = async (id) => {
  console.log(`[fetchHojaData] Cargando datos para Hoja ID: ${id}`);
  isLoadingData.value = true;
  errorMessage.value = '';
  validationErrors.value = {};
  try {
    const response = await axiosInstance.get(`/api/hojas/${id}`);
    const data = response.data;
    console.log("[fetchHojaData] Datos recibidos:", data);

    // Asignación de datos (sin cambios)
    hojaData.personal_id = data.personal_id;
    hojaData.periodo_id = data.periodo_id;
    hojaData.fecha_expedicion = data.fecha_expedicion ? data.fecha_expedicion.slice(0, 10) : null;
    hojaData.jefe_inmediato_id = data.jefe_inmediato_id;
    hojaData.observaciones = data.observaciones;

    incidencias.value = (data.registros_incidencia || []).map(inc => ({
        ...inc,
        fecha: inc.fecha ? inc.fecha.slice(0, 10) : null
    }));
    console.log("[fetchHojaData] Incidencias cargadas y formateadas:", incidencias.value);

  } catch (error) {
     console.error(`[fetchHojaData] Error fetching hoja ${id}:`, error);
     errorMessage.value = `No se pudieron cargar los datos de la hoja (ID: ${id}).`;
     if (error.response?.status === 404) {
         errorMessage.value += " La hoja no fue encontrada.";
         setTimeout(() => router.push('/lista'), 3000);
     }
  } finally {
    isLoadingData.value = false;
  }
};

const addIncidencia = () => {
  incidencias.value.push({
    tipo: '',
    fecha: new Date().toISOString().slice(0, 10),
    descripcion: ''
  });
};

const removeIncidencia = (index) => {
  incidencias.value.splice(index, 1);
};

const handleSubmit = async () => {
  isLoadingSubmit.value = true;
  errorMessage.value = '';
  validationErrors.value = {};

  const payload = {
    periodo_id: hojaData.periodo_id,
    fecha_expedicion: hojaData.fecha_expedicion,
    observaciones: hojaData.observaciones,
    jefe_inmediato_id: hojaData.jefe_inmediato_id,
    ...( !isEditing.value && { personal_id: hojaData.personal_id } ),
    incidencias: incidencias.value
  };

  try {
    let response;
    if (isEditing.value) {
      console.log(`Enviando PUT a /api/hojas/${hojaId.value}`, payload);
      response = await axiosInstance.put(`/api/hojas/${hojaId.value}`, payload);
      // Usar Toast en lugar de alert
      // toast.add({ severity: 'success', summary: 'Éxito', detail: 'Hoja de Servicio actualizada', life: 3000 });
       alert('¡Hoja de Servicio actualizada correctamente!'); // Mantener alert por ahora si no tienes Toast configurado aquí
    } else {
      console.log('Enviando POST a /api/hojas', payload);
      if (!payload.personal_id) payload.personal_id = hojaData.personal_id;
      response = await axiosInstance.post('/api/hojas', payload);
      // toast.add({ severity: 'success', summary: 'Éxito', detail: 'Hoja de Servicio creada', life: 3000 });
      alert('¡Hoja de Servicio creada correctamente!'); // Mantener alert por ahora
    }
    console.log('Respuesta API:', response.data);
    router.push('/lista');
  } catch (error) {
    console.error(`Error al ${isEditing.value ? 'actualizar' : 'crear'} Hoja de Servicio:`, error);
    if (error.response?.status === 422) {
      validationErrors.value = error.response.data.errors || {};
      errorMessage.value = "Por favor, corrige los errores en el formulario.";
    } else {
      errorMessage.value = error.response?.data?.message || `Ocurrió un error al ${isEditing.value ? 'actualizar' : 'guardar'}. Intenta de nuevo.`;
    }
  } finally {
    isLoadingSubmit.value = false;
  }
};

// --- Ciclo de Vida ---
onMounted(async () => {
  isLoadingData.value = true;
  console.log(`[onMounted] Modo Edición: ${isEditing.value}, Hoja ID: ${hojaId.value}`);
  // Cargar personal y periodos en paralelo
  await Promise.all([ fetchPersonal(), fetchPeriodos() ]);
  console.log("[onMounted] Listas de Personal y Periodos cargadas.");
  // Si estamos editando, cargar los datos de la hoja
  if (isEditing.value) {
    await fetchHojaData(hojaId.value);
  }
  isLoadingData.value = false; // Marcar como cargado al final
});

// --- Observadores (sin cambios) ---
watch(hojaData, () => {
    if(Object.keys(validationErrors.value).length > 0) validationErrors.value = {};
    if(errorMessage.value) errorMessage.value = '';
}, { deep: true });
watch(incidencias, () => {
     if(Object.keys(validationErrors.value).length > 0) validationErrors.value = {};
     if(errorMessage.value) errorMessage.value = '';
}, { deep: true });

</script>

<template>
  <div class="hoja-servicio-form p-m-2 p-lg-4">
    <h2>{{ isEditing ? 'Editar Hoja de Servicio' : 'Crear Nueva Hoja de Servicio' }}</h2>

    <div v-if="isLoadingData" class="loading-overlay">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="8" />
      <p>Cargando datos...</p>
    </div>

    <form @submit.prevent="handleSubmit" v-if="!isLoadingData" class="p-fluid">

      <Message v-if="errorMessage" severity="error" :closable="false" class="p-mb-3">{{ errorMessage }}</Message>

      <Fieldset legend="Datos Generales" :toggleable="true" class="p-mb-3">
        <div class="formgrid grid">

          <div class="field col-12 md:col-6">
            <FloatLabel>
              <Select id="personal"
                v-model="hojaData.personal_id"
                :options="personalDropdownOptions"
                optionLabel="displayLabel"
                optionValue="id" 
                :filter="true"
                required
                :invalid="!!validationErrors.personal_id"
                :disabled="isEditing"
                aria-describedby="personal-error"
                class="w-full" />
              <label for="personal">Personal*</label>
            </FloatLabel>
            <small id="personal-error" v-if="validationErrors.personal_id" class="p-error">{{ validationErrors.personal_id[0] }}</small>
          </div>

          <div class="field col-12 md:col-6">
            <FloatLabel>
              <Select id="periodo"
                v-model="hojaData.periodo_id"
                :options="periodosDropdownOptions"
                optionLabel="nombre"
                optionValue="id"
                
                required
                :invalid="!!validationErrors.periodo_id"
                aria-describedby="periodo-error"
                class="w-full"
              />
              <label for="periodo">Periodo*</label>
            </FloatLabel>
            <small id="periodo-error" v-if="validationErrors.periodo_id" class="p-error">{{ validationErrors.periodo_id[0] }}</small>
          </div>

          <div class="field col-12 md:col-6">
            <FloatLabel>
              <Calendar
                id="fecha_expedicion"
                v-model="hojaData.fecha_expedicion"
                dateFormat="yy-mm-dd"
                showIcon
                required
                :invalid="!!validationErrors.fecha_expedicion"
                aria-describedby="fecha_expedicion-error"
                inputClass="w-full" class="w-full"
              />
              <label for="fecha_expedicion">Fecha de Expedición*</label>
            </FloatLabel>
            <small id="fecha_expedicion-error" v-if="validationErrors.fecha_expedicion" class="p-error">{{ validationErrors.fecha_expedicion[0] }}</small>
          </div>

          <div class="field col-12 md:col-6">
            <FloatLabel>
              <Select id="jefe_inmediato"
                v-model="hojaData.jefe_inmediato_id"
                :options="personalDropdownOptions"
                optionLabel="displayLabel"
                optionValue="id" 
                :filter="true"
                showClear
                :invalid="!!validationErrors.jefe_inmediato_id"
                aria-describedby="jefe_inmediato-error"
                class="w-full"
              />
              <label for="jefe_inmediato">Jefe Inmediato (Opcional)</label>
            </FloatLabel>
            <small id="jefe_inmediato-error" v-if="validationErrors.jefe_inmediato_id" class="p-error">{{ validationErrors.jefe_inmediato_id[0] }}</small>
          </div>

          <div class="field col-12">
            <FloatLabel>
              <Textarea
                id="observaciones"
                v-model="hojaData.observaciones"
                rows="3"
                :invalid="!!validationErrors.observaciones"
                aria-describedby="observaciones-error"
                autoResize
                class="w-full" />
              <label for="observaciones">Observaciones (Opcional)</label>
            </FloatLabel>
            <small id="observaciones-error" v-if="validationErrors.observaciones" class="p-error">{{ validationErrors.observaciones[0] }}</small>
          </div>
        </div>
      </Fieldset>

      <Fieldset legend="Registros de Incidencia" :toggleable="true" class="p-mb-3">
        <Message severity="warn" :closable="false" v-if="validationErrors.incidencias && typeof validationErrors.incidencias === 'string'">{{ validationErrors.incidencias }}</Message>
        <Message severity="warn" :closable="false" v-else-if="validationErrors.incidencias && Array.isArray(validationErrors.incidencias) && typeof validationErrors.incidencias[0] === 'string'">{{ validationErrors.incidencias[0] }}</Message>

        <div v-for="(incidencia, index) in incidencias" :key="`inc-${index}`" class="incidencia-item p-mb-3">
          <h4>Incidencia #{{ index + 1 }}</h4>
          <div class="formgrid grid align-items-center"> <div class="field col-12 md:col-3">
              <FloatLabel>
                <Select :id="'tipo-' + index"
                  v-model="incidencia.tipo"
                  :options="tiposIncidenciaOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Tipo *"
                  required
                  :invalid="!!validationErrors[`incidencias.${index}.tipo`]"
                  :aria-describedby="'tipo-error-' + index"
                  class="w-full"
                />
                <label :for="'tipo-' + index">Tipo*</label>
              </FloatLabel>
              <small :id="'tipo-error-' + index" v-if="validationErrors[`incidencias.${index}.tipo`]" class="p-error">{{ validationErrors[`incidencias.${index}.tipo`][0] }}</small>
            </div>

            <div class="field col-12 md:col-3">
              <FloatLabel>
                <Calendar
                  :id="'fecha-' + index"
                  v-model="incidencia.fecha"
                  dateFormat="yy-mm-dd"
                  showIcon
                  required
                  :invalid="!!validationErrors[`incidencias.${index}.fecha`]"
                  :aria-describedby="'fecha-error-' + index"
                  inputClass="w-full"
                  class="w-full"
                />
                <label :for="'fecha-' + index">Fecha*</label>
              </FloatLabel>
              <small :id="'fecha-error-' + index" v-if="validationErrors[`incidencias.${index}.fecha`]" class="p-error">{{ validationErrors[`incidencias.${index}.fecha`][0] }}</small>
            </div>

            <div class="field col-12 md:col-5">
              <FloatLabel>
                <Textarea
                  :id="'descripcion-' + index"
                  v-model="incidencia.descripcion"
                  rows="1"
                  autoResize
                  required
                  :invalid="!!validationErrors[`incidencias.${index}.descripcion`]"
                  :aria-describedby="'descripcion-error-' + index"
                  class="w-full"
                />
                <label :for="'descripcion-' + index">Descripción*</label>
              </FloatLabel>
              <small :id="'descripcion-error-' + index" v-if="validationErrors[`incidencias.${index}.descripcion`]" class="p-error">{{ validationErrors[`incidencias.${index}.descripcion`][0] }}</small>
            </div>

            <div class="field col-12 md:col-1 flex justify-content-center align-self-center">
              <Button
                type="button"
                icon="pi pi-trash"
                class="p-button-danger p-button-text p-button-sm"
                @click="removeIncidencia(index)"
                :disabled="isLoadingSubmit"
                aria-label="Eliminar Incidencia"
                v-tooltip.top="'Eliminar esta incidencia'" />
            </div>
          </div>
        </div>

        <div class="p-mt-2">
          <Button
            type="button"
            label="Añadir Incidencia"
            icon="pi pi-plus"
            class="p-button-secondary p-button-sm p-button-outlined"
            @click="addIncidencia"
            :disabled="isLoadingSubmit"
          />
        </div>
      </Fieldset>

      <div class="flex justify-content-end p-mt-4"> <router-link to="/lista" custom v-slot="{ navigate }">
          <Button
            label="Cancelar"
            icon="pi pi-times"
            severity="secondary" class="p-mr-2" @click="navigate"
            :disabled="isLoadingSubmit"
          />
        </router-link>
        <Button
          type="submit"
          :label="isEditing ? 'Actualizar Hoja' : 'Crear Hoja'"
          icon="pi pi-save"
          severity="success" :loading="isLoadingSubmit"
        />
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Estilos Generales */
.hoja-servicio-form {
  max-width: 900px; /* O el ancho que prefieras */
  margin: 2rem auto; /* Margen vertical y centrado horizontal */
  padding: 1.5rem; /* Padding interno */
  background-color: var(--p-surface-section); /* Fondo de la sección */
  border-radius: var(--p-content-border-radius);
  /* box-shadow: var(--p-card-shadow); Podrías añadir sombra si quieres*/
}

/* Contenedor para carga */
.loading-overlay {
    position: absolute; /* Cubre solo el formulario si este tiene position relative */
    /* O usa 'fixed' para cubrir toda la pantalla */
    inset: 0; /* Abarca todo el contenedor padre (requiere position relative en el padre si es absolute) */
    background-color: color-mix(in srgb, var(--p-surface-ground), transparent 30%); /* Fondo semitransparente */
    z-index: 10; /* Asegurar que esté por encima */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: inherit; /* Heredar borde redondeado */
}
.loading-overlay p {
    margin-top: 1rem;
    font-style: italic;
    color: var(--p-text-muted-color);
}

/* Ajustes espaciado y layout */
.formgrid .field {
    margin-bottom: 1.75rem; /* Espacio estándar entre campos */
}

.incidencia-item {
  border: 1px solid var(--p-content-border-color); /* Usar variable de tema */
  padding: 1.25rem; /* Más padding */
  margin-bottom: 1rem;
  border-radius: var(--p-content-border-radius); /* Usar variable de tema */
  background-color: var(--p-surface-ground); /* Fondo ligeramente diferente */
}
.incidencia-item h4 {
    margin-top: 0;
    margin-bottom: 1.5rem; /* Más espacio debajo del título */
    font-size: 1rem;
    font-weight: 600; /* Ligeramente más grueso */
    color: var(--p-text-color); /* Color de texto estándar */
    border-bottom: 1px solid var(--p-content-border-color); /* Usar variable */
    padding-bottom: 0.75rem;
}

/* Estilo para errores de validación */
.p-error {
    font-size: 0.75rem;
    color: var(--p-red-500); /* Usar variable de color de error */
    margin-top: 0.25rem;
    display: block;
}
/* Asegurar que Select inválido también muestre borde rojo */
:deep(.p-select.p-invalid.p-component > .p-select-trigger) {
    border-color: var(--p-red-500);
}

/* Estilos para Message dentro del form */
:deep(.p-message.p-message-error),
:deep(.p-message.p-message-warn) {
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 1.5rem; /* Ajustar margen si es necesario */
}

/* Espaciado entre botones de acción al final */
/* La clase p-mr-2 ya añade margen, pero puedes ajustar si es necesario */
/* .flex.justify-content-end .p-button { ... } */

/* Limpieza: Estas reglas :deep para ancho de input ya no deberían ser necesarias */
/* con p-fluid y w-full en los componentes */
/*
:deep(.p-float-label input) {
    width: 100%;
}
:deep(.p-password input) {
     width: 100%;
}
*/
</style>