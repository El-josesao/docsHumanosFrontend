<template>
  <div class="p-card p-1">
    <div class="p-card-title text-xl font-semibold mb-4 border-bottom-1 surface-border pb-3">
      {{ props.notaParaEditar ? 'Editar Nota Buena' : 'Crear Nota Buena' }}
    </div>
    <div class="p-card-body mt-4">
      <form @submit.prevent="submitForm">
        <div class="p-fluid grid formgrid">
          
          <div class="field col-12">
            <label class="font-semibold block mb-2">Tipo de Nota</label>
            <div class="flex flex-wrap gap-3">
              <div class="flex align-items-center">
                <RadioButton v-model="form.tipo_nota" inputId="tipoAsistencia" name="tipo_nota_option" value="asistencia" />
                <label for="tipoAsistencia" class="ml-2 cursor-pointer">Asistencia y Puntualidad</label>
              </div>
              <div class="flex align-items-center">
                <RadioButton v-model="form.tipo_nota" inputId="tipoGeneral" name="tipo_nota_option" value="general" />
                <label for="tipoGeneral" class="ml-2 cursor-pointer">Nota General</label>
              </div>
            </div>
          </div>

          <div class="field col-12 md:col-6">
            <label for="personal_id" class="font-semibold block mb-2">Otorgada a</label>
            <Dropdown 
              v-model="form.personal_id" 
              :options="formattedPersonalList" 
              optionLabel="display_rfc" 
              optionValue="id" 
              placeholder="Seleccione un empleado" 
              filter 
              class="w-full" 
              :showClear="form.personal_id !== null"
              required />
          </div>

          <div class="field col-12 md:col-6">
            <label for="jefe_otorga_id" class="font-semibold block mb-2">Otorgada por</label>
            <Dropdown 
              v-model="form.jefe_otorga_id" 
              :options="formattedPersonalList" 
              optionLabel="display_rfc" 
              optionValue="id" 
              placeholder="Seleccione un jefe" 
              filter 
              class="w-full"
              :showClear="form.jefe_otorga_id !== null" 
              :disabled="false" 
              required />
          </div>

          <div class="field col-12 md:col-6">
            <label for="fecha_expedicion" class="font-semibold block mb-2">Fecha de Expedición</label>
            <Calendar 
              v-model="form.fecha_expedicion_date" 
              dateFormat="yy-mm-dd" 
              class="w-full" 
              placeholder="AAAA-MM-DD"
              showIcon
              required />
          </div>

          <div class="field col-12 md:col-6">
            <label for="numero_oficio" class="font-semibold block mb-2">Número de Oficio (Opcional)</label>
            <InputText id="numero_oficio" v-model="form.numero_oficio" class="w-full" placeholder="Ej: RHI-001/2025" />
          </div>

          <div class="field col-12">
            <label class="font-semibold block mb-2">Fundamento / Motivo Específico (Obligatorio)</label>
            <div v-if="isAsistencia" class="p-inputtext mt-1 p-3 border-1 surface-border border-round bg-gray-100 text-sm">
                {{ referenciaArticulosOptions.a.textoCompleto }}
            </div>
            <div v-else class="flex flex-column gap-2 mt-2">
                <div v-for="option in generalReferenciaOptions" :key="option.value" class="flex align-items-center">
                    <RadioButton v-model="selectedGeneralReferenciaKey" :inputId="option.value" name="generalReferencia" :value="option.value" />
                    <label :for="option.value" class="ml-2 text-sm cursor-pointer">{{ option.label }}</label>
                </div>
                <Textarea
                    v-if="form.tipo_nota === 'general' && form.referencia_articulos"
                    :modelValue="form.referencia_articulos"
                    rows="5"
                    readonly
                    class="w-full text-sm mt-2 bg-gray-50 border-1 surface-border border-round p-3" 
                    autoResize />
            </div>
          </div>
          
          <div class="field col-12">
            <label for="cuerpo" class="font-semibold block mb-2">Cuerpo del Documento</label>
            <Textarea 
              id="cuerpo" 
              v-model="form.cuerpo" 
              rows="6" 
              :readonly="isAsistencia" 
              class="w-full text-sm" 
              autoResize 
              required />
          </div>

        </div>
        
        <div class="flex justify-content-end mt-5 pt-4 border-top-1 surface-border">
            <Button label="Cancelar" severity="secondary" @click="goBack" class="mr-2 p-button-outlined"/>
            <Button 
              type="submit" 
              :label="props.notaParaEditar ? 'Actualizar Nota' : 'Guardar Nota'" 
              :loading="notasStore.loading" 
              icon="pi pi-save" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePersonalStore } from '@/stores/personal';
import { useNotasBuenasStore } from '@/stores/notasBuenas';
// import { useConfiguracionStore } from '@/stores/configuracionStore'; // Comentado, no se usa para jefe_otorga_id en esta versión
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import Dropdown from 'primevue/dropdown';
import RadioButton from 'primevue/radiobutton';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

const props = defineProps({
  notaParaEditar: {
    type: Object,
    default: null,
  }
});

const router = useRouter();
const personalStore = usePersonalStore();
const notasStore = useNotasBuenasStore();
// const configuracionStore = useConfiguracionStore(); // Comentado
const toast = useToast();

const referenciaArticulosOptions = {
  a: { 
    label: "a) Asistencia y puntualidad (30 días)",
    textoCompleto: "Con fundamento en el Artículo 81 inciso A del Reglamento de las Condiciones Generales del Trabajo del Personal al Servicio de la S.E.P., y el Artículo 157 inciso a) del Reglamento Interno de trabajo del Personal no Docente: Cuando no haya incurrido en retardos ni faltas de asistencia a sus labores durante 30 días hábiles consecutivos."
  },
  b: {
    label: "b) Desempeño excepcional (calidad/intensidad)",
    textoCompleto: "Con fundamento en el Artículo 81 inciso A del Reglamento de las Condiciones Generales del Trabajo del Personal al Servicio de la S.E.P., y el Artículo 157 inciso b) del Reglamento Interno de trabajo del Personal no Docente: Por realizar en forma excepcional mejorando notablemente la intensidad y calidad de sus labores, a criterio de su jefe inmediato la carga de trabajo asignada normalmente durante un mes."
  },
  c: {
    label: "c) Actividades adicionales (fuera de carga normal)",
    textoCompleto: "Con fundamento en el Artículo 81 inciso A del Reglamento de las Condiciones Generales del Trabajo del Personal al Servicio de la S.E.P., y el Artículo 157 inciso c) del Reglamento Interno de trabajo del Personal no Docente: Por realizar adicionalmente, actividades solicitadas por su jefe inmediato, pero no definidas en su carga normal de trabajo."
  },
  d: {
    label: "d) Proyecto de simplificación/sistematización aceptado",
    textoCompleto: "Con fundamento en el Artículo 81 inciso A del Reglamento de las Condiciones Generales del Trabajo del Personal al Servicio de la S.E.P., y el Artículo 157 inciso d) del Reglamento Interno de trabajo del Personal no Docente: Por cada proyecto para simplificar el trabajo o sistematizar las labores que presente y que sea aceptado y aplicado."
  }
};

const generalReferenciaOptions = ref([
  { label: referenciaArticulosOptions.b.label, value: 'b' },
  { label: referenciaArticulosOptions.c.label, value: 'c' },
  { label: referenciaArticulosOptions.d.label, value: 'd' },
]);
const selectedGeneralReferenciaKey = ref(null); 

const initialFormState = () => ({
  personal_id: null,
  jefe_otorga_id: null,
  tipo_nota: 'asistencia',
  fecha_expedicion: new Date().toISOString().slice(0, 10),
  fecha_expedicion_date: new Date(),
  numero_oficio: '',
  cuerpo: asistenciaTexts.cuerpo,
  referencia_articulos: referenciaArticulosOptions.a.textoCompleto,
});

const form = ref(initialFormState());

const formattedPersonalList = computed(() => {
  if (personalStore.personal?.length) {
    return personalStore.personal.map(person => ({
      ...person,
      display_rfc: `${person.nombre} (RFC: ${person.rfc || 'N/A'})`
    }));
  }
  return [];
});

const isAsistencia = computed(() => form.value.tipo_nota === 'asistencia');

const asistenciaTexts = {
  cuerpo: "Se extiende la presente NOTA BUENA por no haber incurrido en retardos ni faltas de asistencia a sus labores durante 30 días hábiles consecutivos.\n\nAgradeciendo su compromiso con los objetivos institucionales, reciba una felicitación por su excelente desempeño en sus registros de asistencia.",
};

watch(
  [() => form.value.tipo_nota, selectedGeneralReferenciaKey], 
  ([newTipoNota, newSelectedKey], [oldTipoNota, oldSelectedKey]) => {
    if (newTipoNota === 'asistencia') {
      form.value.cuerpo = asistenciaTexts.cuerpo;
      form.value.referencia_articulos = referenciaArticulosOptions.a.textoCompleto;
      // jefe_otorga_id NO se modifica aquí, es manual
      // selectedGeneralReferenciaKey.value = null; // Si se cambia a asistencia, la selección general se anula
    } else { // tipo_nota === 'general'
      if (oldTipoNota === 'asistencia' && newTipoNota === 'general') {
          form.value.cuerpo = '';
          // jefe_otorga_id se mantiene o se limpia si es nueva nota general
          if (!props.notaParaEditar) {
            form.value.jefe_otorga_id = null; 
          }
      }
      
      if (newSelectedKey && referenciaArticulosOptions[newSelectedKey]) {
          form.value.referencia_articulos = referenciaArticulosOptions[newSelectedKey].textoCompleto;
      } else if (!props.notaParaEditar || (oldTipoNota === 'asistencia' && newTipoNota === 'general' && !newSelectedKey)) {
          form.value.referencia_articulos = '';
      }
    }
  }, 
  { immediate: true }
);

watch(() => form.value.fecha_expedicion_date, (newDate) => {
  if (newDate instanceof Date) {
    form.value.fecha_expedicion = newDate.toISOString().slice(0,10);
  } else if (typeof newDate === 'string' && newDate) {
     form.value.fecha_expedicion = newDate;
     const dateParts = newDate.split('-');
     if (dateParts.length === 3) {
        form.value.fecha_expedicion_date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
     }
  }
});

onMounted(async () => {
  // Ya no se llama a fetchConfiguracion aquí para este propósito
  if (!personalStore.personal?.length) {
    await personalStore.fetchPersonal();
  }

  if (props.notaParaEditar) {
    Object.assign(form.value, props.notaParaEditar);
    if (props.notaParaEditar.fecha_expedicion) {
      const dateParts = props.notaParaEditar.fecha_expedicion.split('-');
      form.value.fecha_expedicion_date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    }
    if (form.value.tipo_nota === 'general') {
        let foundKey = null;
        for (const key in referenciaArticulosOptions) {
            if (referenciaArticulosOptions[key].textoCompleto === form.value.referencia_articulos) {
                foundKey = key;
                break;
            }
        }
        selectedGeneralReferenciaKey.value = foundKey;
    }
  } else {
    form.value = initialFormState(); // Reiniciar para asegurar estado limpio
  }
});

const submitForm = async () => {
    if (!form.value.personal_id || 
        !form.value.jefe_otorga_id || 
        !form.value.fecha_expedicion_date || 
        !form.value.cuerpo ||
        !form.value.referencia_articulos
    ) {
        toast.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Por favor, rellene todos los campos obligatorios, incluyendo el Fundamento/Motivo.', life: 4000 });
        return;
    }

    try {
        const payload = { ...form.value };
        if (payload.fecha_expedicion_date instanceof Date) {
            payload.fecha_expedicion = payload.fecha_expedicion_date.toISOString().slice(0,10);
        }
        delete payload.fecha_expedicion_date;

        if (props.notaParaEditar && props.notaParaEditar.id) {
             console.log("Actualizaría nota:", props.notaParaEditar.id, payload);
             toast.add({ severity: 'info', summary: 'Pendiente', detail: 'Funcionalidad de actualizar no implementada.', life: 3000 });
        } else {
            await notasStore.createNotaBuena(payload);
            toast.add({ severity: 'success', summary: 'Éxito', detail: 'Nota Buena creada correctamente.', life: 3000 });
        }
        
        router.push({ name: 'ListarNotasBuenas' });
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Ocurrió un error desconocido.';
        const validationErrors = error?.response?.data?.errors;
        let detailMessage = String(errorMessage);

        if (validationErrors) {
            detailMessage += " Detalles: ";
            for (const field in validationErrors) {
                detailMessage += `${field}: ${validationErrors[field].join(', ')} `;
            }
        }
        toast.add({ severity: 'error', summary: 'Error al guardar', detail: detailMessage, life: 7000 });
        console.error("Error en submitForm:", error);
    }
};

const goBack = () => {
    router.back();
}
</script>

<style scoped>
.field {
  margin-bottom: 1rem;
}
.p-card-title {
  /* Estilos ya definidos en el template */
}
.field.col-12 > .p-inputtextarea,
.field.col-12 > .p-inputtext,
.field.col-12 > .p-calendar {
    width: 100%;
}
.flex.align-items-center label.ml-2 {
    cursor: pointer;
}
.p-inputtext.bg-gray-100 { /* Para el div que muestra la referencia de asistencia */
    background-color: #f3f4f6; 
    color: #4b5563; 
    cursor: default;
}
/* Estilo para el Textarea que muestra el texto completo del inciso general seleccionado */
.mt-2.bg-gray-50 {
    background-color: #f9fafb; 
    border: 1px solid #e5e7eb; 
    border-radius: var(--p-input-border-radius, 6px);
    padding: 0.75rem;
    color: #4b5563;
}
</style>