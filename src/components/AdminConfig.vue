<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axiosInstance from '@/plugins/axios.js';

// --- Importar Componentes PrimeVue ---
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Fieldset from 'primevue/fieldset';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Divider from 'primevue/divider';
import Image from 'primevue/image';
import FileUpload from 'primevue/fileupload';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast'; // Importar aunque se declare en App.vue para referencia

// --- Importar Servicio de Notificaciones (Toast) ---
import { useToast } from 'primevue/usetoast';
const toast = useToast();

// --- Estado Reactivo ---
const configData = ref({
  id: 1,
  jefe_rh_predeterminado_id: null,
  hoja_membretada_path: null,
  hoja_membretada_url: null, // URL absoluta generada por backend
  jefe_rh_predeterminado: null
});
const selectedJefeRhId = ref(null);
const personalList = ref([]);
const periodosList = ref([]);
const newPeriodoName = ref('');
const isLoading = ref(true);
const isSavingConfig = ref(false);
const isAddingPeriodo = ref(false);
const isUploadingMembrete = ref(false); // Cambiado nombre para claridad
const isImportingPersonal = ref(false); // Cambiado nombre para claridad

// Para subida de archivos
const selectedMembreteFile = ref(null);
const membretePreview = ref(null);
const membreteTimestamp = ref(Date.now()); // Para forzar recarga imagen
const selectedImportFile = ref(null); // Archivo para importación de personal
const importResults = ref(null); // Resultados de la importación

// --- Opciones Calculadas para Dropdown ---
const personalDropdownOptions = computed(() => {
  return [
    { value: null, label: '-- Ninguno --' },
    ...(personalList.value || []).map(p => ({
        value: p.id,
        label: `${p.nombre} (RFC: ${p.rfc})`
    }))
  ];
});

// --- Métodos ---

// Cargar todos los datos iniciales
const fetchData = async () => {
  isLoading.value = true;
  configData.value = { id: 1, jefe_rh_predeterminado_id: null, hoja_membretada_path: null, hoja_membretada_url: null, jefe_rh_predeterminado: null };
  selectedJefeRhId.value = null;
  personalList.value = [];
  periodosList.value = [];

  const configReq = axiosInstance.get('/api/configuracion');
  const personalReq = axiosInstance.get('/api/personal');
  const periodosReq = axiosInstance.get('/api/periodos?todos=1'); // Obtener todos para la lista

  try {
    const [configRes, personalRes, periodosRes] = await Promise.all([configReq, personalReq, periodosReq]);

    configData.value = configRes.data;
    selectedJefeRhId.value = configData.value.jefe_rh_predeterminado_id;
    personalList.value = personalRes.data;
    periodosList.value = (periodosRes.data || []).sort((a, b) => b.id - a.id);
    membreteTimestamp.value = Date.now();

    console.log("Configuración cargada:", configData.value);

  } catch (error) {
    console.error("Error cargando datos de configuración:", error);
    toast.add({ severity: 'error', summary: 'Error de Carga', detail: 'No se pudieron cargar los datos iniciales.', life: 4000 });
  } finally {
    isLoading.value = false;
  }
};

// Guardar el Jefe de RH seleccionado
const saveConfig = async () => {
  isSavingConfig.value = true;
  try {
    const payload = { jefe_rh_predeterminado_id: selectedJefeRhId.value };
    const response = await axiosInstance.put('/api/configuracion', payload);
    configData.value = response.data;
    selectedJefeRhId.value = configData.value.jefe_rh_predeterminado_id;
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Jefe de RH predeterminado actualizado.', life: 3000 });
  } catch (error) {
    console.error("Error guardando configuración:", error);
    const message = error.response?.data?.message || 'Error al guardar Jefe de RH.';
     if (error.response?.status === 422 && error.response.data.errors?.jefe_rh_predeterminado_id) {
         toast.add({ severity: 'error', summary: 'Error de Validación', detail: error.response.data.errors.jefe_rh_predeterminado_id[0], life: 4000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
    }
  } finally {
    isSavingConfig.value = false;
  }
};

// Añadir un nuevo periodo
const addPeriodo = async () => {
  const nombreTrimmed = newPeriodoName.value.trim();
  if (!nombreTrimmed) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'El nombre del periodo no puede estar vacío.', life: 3000 });
    return;
  }
  isAddingPeriodo.value = true;
  try {
    const response = await axiosInstance.post('/api/periodos', { nombre: nombreTrimmed });
    periodosList.value.unshift(response.data);
    periodosList.value.sort((a, b) => b.id - a.id); // Re-ordenar
    newPeriodoName.value = '';
    toast.add({ severity: 'success', summary: 'Éxito', detail: `Periodo "${response.data.nombre}" añadido.`, life: 3000 });
  } catch (error) {
    console.error("Error añadiendo periodo:", error);
    const message = error.response?.data?.message || 'Error al añadir el periodo.';
    if (error.response?.status === 422 && error.response.data.errors?.nombre) {
         toast.add({ severity: 'error', summary: 'Error de Validación', detail: error.response.data.errors.nombre[0], life: 4000 });
    } else {
         toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
    }
  } finally {
    isAddingPeriodo.value = false;
  }
};

// --- Métodos para Subida de Membrete ---
const onMembreteFileSelect = (event) => {
  if (event.files && event.files.length > 0) {
    selectedMembreteFile.value = event.files[0];
    if (membretePreview.value) { URL.revokeObjectURL(membretePreview.value); }
    membretePreview.value = URL.createObjectURL(selectedMembreteFile.value);
  } else {
    selectedMembreteFile.value = null;
    if(membretePreview.value) URL.revokeObjectURL(membretePreview.value);
    membretePreview.value = null;
  }
};

const uploadMembrete = async () => {
  if (!selectedMembreteFile.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Selecciona primero un archivo de imagen.', life: 3000 });
    return;
  }
  isUploadingMembrete.value = true;
  const formData = new FormData();
  formData.append('membrete', selectedMembreteFile.value);

  try {
    // RECORDATORIO: Falta implementar esta ruta/método en el backend
    const response = await axiosInstance.post('/api/configuracion/upload-membrete', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    configData.value = response.data;
    selectedJefeRhId.value = configData.value.jefe_rh_predeterminado_id;
    selectedMembreteFile.value = null;
    if(membretePreview.value) URL.revokeObjectURL(membretePreview.value);
    membretePreview.value = null;
    membreteTimestamp.value = Date.now();
    toast.add({ severity: 'success', summary: 'Éxito', detail: 'Hoja membretada actualizada.', life: 3000 });
  } catch (error) {
    console.error("Error subiendo membrete:", error);
    const message = error.response?.data?.message || 'Error al subir la imagen.';
     if (error.response?.status === 422 && error.response.data.errors?.membrete) {
         toast.add({ severity: 'error', summary: 'Error de Validación', detail: error.response.data.errors.membrete[0], life: 4000 });
    } else if (error.response?.status === 404) {
        toast.add({ severity: 'error', summary: 'Error 404', detail: 'Funcionalidad de subida no encontrada en el backend.', life: 4000 });
    } else {
        toast.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
    }
  } finally {
    isUploadingMembrete.value = false;
  }
};


// --- Métodos para Importación de Personal ---
const onImportFileSelect = (event) => {
   if (event.files && event.files.length > 0) {
    selectedImportFile.value = event.files[0];
    importResults.value = null; // Limpiar resultados anteriores
    toast.add({ severity: 'info', summary: 'Archivo Seleccionado', detail: selectedImportFile.value.name, life: 3000 });
  } else {
    selectedImportFile.value = null;
  }
};

const handleImport = async () => {
  if (!selectedImportFile.value) {
    toast.add({ severity: 'warn', summary: 'Atención', detail: 'Por favor, selecciona primero un archivo CSV o Excel para importar.', life: 3000 });
    return;
  }
  isImportingPersonal.value = true;
  importResults.value = null;
  const formData = new FormData();
  formData.append('archivo_personal', selectedImportFile.value);

  console.log("Enviando archivo para importar a /api/personal/import...");
  try {
    const response = await axiosInstance.post('/api/personal/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log("Respuesta de importación:", response.data);
    importResults.value = { success: true, message: response.data.message || 'Importación procesada.', errors: null };
    toast.add({ severity: 'success', summary: 'Importación Enviada', detail: importResults.value.message, life: 5000 });
    selectedImportFile.value = null;
    // Forzar recarga de datos generales para ver posible nuevo personal en dropdowns?
    // fetchData(); // O solo fetchPersonal()
  } catch (error) {
    console.error("Error durante la importación:", error);
    let message = 'Error inesperado durante la importación.';
    let validationErrors = null;
    if (error.response) {
      message = error.response.data.message || message;
      if (error.response.status === 422) { // Errores de validación por fila
        validationErrors = error.response.data.validation_errors || ['Error de formato o datos en el archivo.'];
        message = 'El archivo contiene errores. Algunas filas no se importaron.';
      }
    }
    importResults.value = { success: false, message: message, errors: validationErrors };
    toast.add({ severity: 'error', summary: 'Error de Importación', detail: message, life: 8000 });
  } finally {
    isImportingPersonal.value = false;
  }
};

// --- Ciclo de Vida ---
onMounted(() => {
  fetchData();
});

</script>

<template>
  <div class="admin-config p-m-2 p-lg-4">
    <h2>Panel de Configuración</h2>

    <div v-if="isLoading" class="loading-overlay p-d-flex p-jc-center p-mt-4">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    </div>

    <div v-else class="p-fluid">

      <Fieldset legend="Jefe de Recursos Humanos Predeterminado" :toggleable="true" class="p-mb-3">
        <p class="p-mb-2">Selecciona la persona que firmará como Jefe/a de RH en las Hojas de Servicio generadas.</p>
        <div class="formgrid grid p-ai-center">
          <div class="field col-12 md:col-8">
            <Dropdown
              id="jefe-rh"
              v-model="selectedJefeRhId"
              :options="personalDropdownOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona o busca..."
              :filter="true"
              showClear
              style="width: 100%;"
              :disabled="isSavingConfig"
            />
             <small class="p-mt-1 p-d-block">
                Selección guardada:
                <strong v-if="configData.jefe_rh_predeterminado">{{ configData.jefe_rh_predeterminado.nombre }}</strong>
                <em v-else>Ninguno</em>
            </small>
          </div>
          <div class="field col-12 md:col-4 p-d-flex p-ai-end p-jc-start">
            <Button
              label="Guardar Jefe RH"
              icon="pi pi-save"
              @click="saveConfig"
              :loading="isSavingConfig"
              class="p-button-success p-mt-3 md:p-mt-0"
            />
          </div>
        </div>
      </Fieldset>

      <Fieldset legend="Periodos Disponibles" :toggleable="true" class="p-mb-3">
         <div class="formgrid grid p-ai-center">
            <div class="field col-12 md:col-8">
                <label for="nuevo-periodo">Nombre del Nuevo Periodo</label>
                <InputText id="nuevo-periodo" type="text" v-model="newPeriodoName" placeholder="Ej: Anual 2026" />
            </div>
             <div class="field col-12 md:col-4 p-d-flex p-ai-end p-jc-start">
                 <Button
                    label="Añadir Periodo"
                    icon="pi pi-plus"
                    @click="addPeriodo"
                    :loading="isAddingPeriodo"
                    class="p-button-secondary p-mt-3 md:p-mt-0"
                    />
            </div>
            <div class="col-12">
                 <Divider align="left" type="dashed" class="p-my-3"><b>Periodos Existentes</b></Divider>
                 <ul v-if="periodosList.length > 0" class="periodos-list">
                     <li v-for="periodo in periodosList" :key="periodo.id" class="p-d-flex p-jc-between p-ai-center">
                         <span>{{ periodo.nombre }}</span>
                         <Tag :severity="periodo.activo ? 'success' : 'danger'" :value="periodo.activo ? 'Activo' : 'Inactivo'"></Tag>
                         </li>
                 </ul>
                 <p v-else>No hay periodos definidos.</p>
            </div>
         </div>
      </Fieldset>

      <Fieldset legend="Hoja Membretada" :toggleable="true" class="p-mb-3">
           <Message severity="warn" :closable="false">La funcionalidad de subir y guardar el membrete en el servidor aún no está implementada en el backend.</Message>
           <div class="formgrid grid p-mt-3">
               <div class="field col-12 md:col-6">
                   <p><strong>Membrete Actual:</strong></p>
                    <div v-if="configData.hoja_membretada_url" class="membrete-container">
                       <Image :src="configData.hoja_membretada_url + '?t=' + membreteTimestamp" alt="Membrete actual" width="250" preview />
                       <small class="p-d-block p-mt-1">Ruta Relativa: {{ configData.hoja_membretada_path }}</small>
                    </div>
                    <p v-else>No hay membrete configurado.</p>
               </div>
                <div class="field col-12 md:col-6">
                   <p><strong>Subir/Reemplazar Membrete:</strong> (Max 2MB: JPG, PNG, GIF)</p>
                    <FileUpload
                        name="membrete"
                        @select="onMembreteFileSelect"
                        :multiple="false"
                        accept="image/*"
                        :maxFileSize="2000000"
                        :auto="false"
                        :customUpload="true"
                        chooseLabel="Seleccionar Imagen"
                        :disabled="isUploadingMembrete"
                        invalidFileSizeMessage="El archivo supera los {0}."
                        invalidFileTypeMessage="Tipo de archivo inválido. Solo imágenes."
                         >
                        <template #empty>
                            <p>Arrastra y suelta la imagen aquí.</p>
                        </template>
                    </FileUpload>

                    <div v-if="membretePreview" class="p-mt-3 preview-container">
                         <p><strong>Previsualización:</strong></p>
                         <Image :src="membretePreview" alt="Vista previa membrete" width="150" />
                     </div>
                     <Button
                        v-if="selectedMembreteFile"
                        label="Confirmar Subida Membrete"
                        icon="pi pi-upload"
                        class="p-button-success p-mt-3"
                        @click="uploadMembrete"
                        :loading="isUploadingMembrete"
                        :disabled="!selectedMembreteFile || isUploadingMembrete"
                        />
                </div>
           </div>
      </Fieldset>

      <Fieldset legend="Importación Masiva de Personal (CSV/Excel)" :toggleable="true" class="p-mb-3">
          <div class="formgrid grid">
              <div class="field col-12">
                  <p>Selecciona el archivo CSV o Excel con los datos del personal. <br>
                     Revisa que la primera fila contenga los nombres de columna correctos y que los datos (especialmente RFC, No. Tarjeta, fechas) cumplan el formato esperado.</p>

                   <FileUpload
                        name="archivo_personal" @select="onImportFileSelect"
                        :multiple="false"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                        :maxFileSize="5242880" :auto="false"
                        :customUpload="true"
                        chooseLabel="Seleccionar Archivo (Personal)"
                        :disabled="isImportingPersonal"
                        invalidFileSizeMessage="El archivo supera los {0}."
                        invalidFileTypeMessage="Tipo de archivo inválido. Solo CSV o Excel."
                        class="p-mb-3"
                   >
                       <template #empty>
                           <p>Arrastra y suelta el archivo aquí.</p>
                       </template>
                   </FileUpload>
              </div>

              <div class="field col-12">
                   <Button
                       label="Importar Archivo Seleccionado"
                       icon="pi pi-users"
                       @click="handleImport"
                       :disabled="!selectedImportFile || isImportingPersonal"
                       :loading="isImportingPersonal"
                       />
               </div>

               <div class="field col-12 p-mt-3" v-if="importResults">
                   <Message :severity="importResults.success ? 'success' : 'error'" :closable="true" :sticky="!importResults.success">
                       {{ importResults.message }}
                   </Message>
                   <ul v-if="importResults.errors && importResults.errors.length > 0" class="p-error p-mt-2 import-errors">
                        <li v-for="(err, index) in importResults.errors" :key="index">
                            {{ err }}
                        </li>
                   </ul>
               </div>

          </div>
      </Fieldset>

       <Fieldset legend="Administración Adicional" :toggleable="true">
        <p>Para otras tareas administrativas (gestión detallada de usuarios, logs, etc.), utiliza la interfaz correspondiente si existe.</p>
        </Fieldset>

    </div> </div>
</template>

<style scoped>
.admin-config {
  max-width: 900px;
  margin: 20px auto;
  padding: 15px;
}
.loading-overlay {
    padding: 50px; text-align: center;
}
.loading-overlay p {
    margin-top: 10px; font-style: italic;
}
.p-fieldset legend {
  font-size: 1.1rem; font-weight: bold; padding: 0.5rem 1rem;
}
ul.periodos-list {
    list-style: none; padding: 0; margin-top: 0.5rem;
}
ul.periodos-list li {
    padding: 0.5rem 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;
}
ul.periodos-list li:last-child { border-bottom: none; }
.membrete-container, .preview-container {
    margin-top: 0.5rem; border: 1px solid #eee; padding: 0.5rem; display: inline-block; border-radius: 6px; text-align: center;
}
small { color: #6c757d; }
.p-error { font-size: 0.75rem; margin-top: 4px; display: block; }
:deep(.p-message) { width: 100%; box-sizing: border-box; margin-bottom: 1rem; }
.p-d-flex.p-jc-end { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eee; }
.p-mr-2 { margin-right: 0.5rem; }
.p-mt-3 { margin-top: 1rem; }
.p-mb-3 { margin-bottom: 1rem; } /* Espacio consistente debajo de fieldsets/elementos */
.import-errors { list-style: disc; margin-left: 25px; font-size: 0.85rem; }
.import-errors li { margin-bottom: 5px; }

/* Asegurar que los labels dentro de fieldset tengan un margen inferior */
.p-fluid .field > label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}
/* Quitar margen inferior del último elemento dentro de un field para consistencia */
.p-fluid .field:last-child {
    margin-bottom: 0;
}

/* Ajuste para botón de importar */
.field .p-button {
    /* width: auto; */ /* Permitir que el botón tome su ancho natural */
}

@media screen and (max-width: 767px) {
    /* Ajustes responsivos si son necesarios */
     .formgrid .field.md\:col-4, .formgrid .field.md\:col-6, .formgrid .field.md\:col-8 {
        text-align: left; /* No centrar botones en móvil por defecto */
    }
     .formgrid .field .p-button {
        margin-top: 0.5rem;
    }
     /* Hacer que botones de acción ocupen más ancho en móvil */
     .p-d-flex.p-jc-end {
         flex-direction: column;
         gap: 0.5rem;
     }
      .p-d-flex.p-jc-end .p-button {
         width: 100%;
         margin-right: 0 !important; /* Quitar margen derecho */
     }
      .p-d-flex.p-jc-end .p-button-secondary {
         order: 1; /* Poner cancelar al final en móvil */
     }

}
</style>