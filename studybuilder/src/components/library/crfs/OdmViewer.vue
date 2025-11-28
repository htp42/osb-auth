<template>
  <div>
    <v-row class="mt-2 ml-2 mr-2" style="display: flex">
      <v-col cols="2">
        <v-select
          v-model="selectedTemplates"
          :items="templates"
          :label="$t('OdmViewer.crf_template')"
          variant="outlined"
          density="compact"
          clearable
          multiple
          return-object
          item-title="name"
          item-value="value"
          class="mt-2"
          @update:model-value="getFormsForTemplates()"
        >
          <template #selection="{ item, index }">
            <div v-if="index === 0">
              <span>{{
                item.title.length > 25
                  ? item.title.substring(0, 25) + '...'
                  : item.title
              }}</span>
            </div>
            <span v-if="index === 1" class="grey--text text-caption mr-1">
              (+{{ selectedTemplates.length - 1 }})
            </span>
          </template>
        </v-select>
      </v-col>
      <v-col cols="3">
        <v-autocomplete
          v-model="selectedForms"
          :items="forms"
          :label="$t('OdmViewer.select_forms')"
          variant="outlined"
          density="compact"
          clearable
          multiple
          class="mt-2"
          item-title="name"
          item-value="uid"
        >
          <template #selection="{ item, index }">
            <div v-if="index === 0">
              <span>{{
                item.title.length > 25
                  ? item.title.substring(0, 25) + '...'
                  : item.title
              }}</span>
            </div>
            <span v-if="index === 1" class="grey--text text-caption mr-1">
              (+{{ selectedForms.length - 1 }})
            </span>
          </template>
        </v-autocomplete>
      </v-col>
      <v-col cols="2">
        <v-select
          v-model="element_status"
          :items="elementStatuses"
          :label="$t('OdmViewer.element_status')"
          variant="outlined"
          density="compact"
          class="mt-2"
        />
      </v-col>
      <v-col cols="2">
        <v-select
          v-model="data.selectedStylesheet"
          :items="data.stylesheet"
          variant="outlined"
          density="compact"
          class="mt-2"
          :label="$t('OdmViewer.stylesheet')"
        />
      </v-col>
      <v-col cols="2">
        <v-btn
          color="secondary"
          :label="$t('_global.load')"
          variant="flat"
          rounded="xl"
          class="mt-2"
          :disabled="selectedForms.length === 0"
          @click="loadXml"
        >
          {{ $t('OdmViewer.load') }}
        </v-btn>
      </v-col>
      <v-spacer />
      <v-menu rounded offset-y>
        <template #activator="{ props }">
          <slot name="button" :props="props">
            <v-btn
              class="mr-4 mt-4"
              size="small"
              variant="outlined"
              color="nnBaseBlue"
              v-bind="props"
              :title="$t('DataTableExportButton.export')"
              data-cy="table-export-button"
              icon="mdi-download-outline"
              :disabled="!doc"
              :loading="loading || exportLoading"
            />
          </slot>
        </template>
        <v-list>
          <v-list-item link color="nnBaseBlue" @click="downloadXml">
            <v-list-item-title class="nnBaseBlue">
              <v-icon color="nnBaseBlue" class="mr-2">
                mdi-file-xml-box
              </v-icon>
              {{ $t('DataTableExportButton.export_xml') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item link color="nnBaseBlue" @click="downloadPdf">
            <v-list-item-title class="nnBaseBlue">
              <v-icon color="nnBaseBlue" class="mr-2">
                mdi-file-pdf-box
              </v-icon>
              {{ $t('DataTableExportButton.export_pdf') }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item link color="nnBaseBlue" @click="downloadHtml">
            <v-list-item-title class="nnBaseBlue">
              <v-icon color="nnBaseBlue" class="mr-2">
                mdi-file-document-outline
              </v-icon>
              {{ $t('DataTableExportButton.export_html') }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-row>
    <div v-show="loading">
      <v-row align="center" justify="center" style="text-align: -webkit-center">
        <v-col cols="12" sm="4">
          <div class="text-h5">
            {{ $t('OdmViewer.loading_message') }}
          </div>
          <v-progress-circular
            color="primary"
            indeterminate
            size="128"
            class="ml-4"
          />
        </v-col>
      </v-row>
    </div>
    <div v-show="doc && !showOdmXml" class="mt-4">
      <iframe />
    </div>
    <div v-show="doc && showOdmXml" class="mt-4">
      <v-card color="primary" style="overflow-x: auto">
        <pre v-show="!loading" class="ml-6 mt-6 pre" style="color: #ff0">{{
          xmlString
        }}</pre>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import crfs from '@/api/crfs'
import statuses from '@/constants/statuses'
import exportLoader from '@/utils/exportLoader'
import { DateTime } from 'luxon'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const elementStatuses = [
  statuses.LATEST,
  statuses.FINAL,
  statuses.DRAFT,
  statuses.RETIRED,
]

const showOdmXml = ref(false)

const selectedTemplates = ref([])
const templates = ref([])
const selectedForms = ref([])
const forms = ref([])

let xml = ''
const xmlString = ref('')
const doc = ref(null)
const data = ref({
  target_type: 'form',
  stylesheet: [
    {
      title: t('OdmViewer.crf_with_annotations'),
      value: 'with-annotations',
    },
    {
      title: t('OdmViewer.falcon'),
      value: 'falcon',
    },
  ],
  selectedStylesheet: 'falcon',
  export_to: 'v1',
})
const loading = ref(false)
const exportLoading = ref(false)
const element_status = ref(statuses.LATEST)

onMounted(() => {
  getTemplates()
})

function getTemplates() {
  const params = { page_size: 0 }
  crfs.get('study-events', { params }).then((resp) => {
    templates.value = resp.data.items
  })
}

function getFormsForTemplates() {
  try {
    forms.value = []
    selectedForms.value = []
    selectedTemplates.value.forEach((template) => {
      forms.value = [...forms.value, ...template.forms]
    })
    forms.value = forms.value.filter(
      (form1, i, arr) => arr.findIndex((form2) => form2.uid === form1.uid) === i
    )
  } catch (error) {
    console.error(error)
  }
}

async function loadXml() {
  doc.value = ''
  loading.value = true
  data.value.status = element_status.value.toLowerCase()
  data.value.allowed_namespaces = '&allowed_namespaces=*'
  data.value.target_uids = ''
  selectedForms.value.forEach((form) => {
    data.value.target_uids += `target_uids=${form}&`
  })
  crfs.getXml(data.value).then((resp) => {
    const parser = new DOMParser()
    xmlString.value = resp.data
    xml = parser.parseFromString(resp.data, 'application/xml')
    const xsltProcessor = new XSLTProcessor()
    crfs.getXsl(data.value.selectedStylesheet).then((resp) => {
      const xmlDoc = parser.parseFromString(resp.data, 'text/xml')
      xsltProcessor.importStylesheet(xmlDoc)
      doc.value = new XMLSerializer().serializeToString(
        xsltProcessor.transformToDocument(xml)
      )

      var iframe = document.createElement('iframe')
      iframe.classList.add('frame')
      document.querySelector('iframe').replaceWith(iframe)
      var iframeDoc = iframe.contentDocument
      iframeDoc.write(doc.value)
      iframeDoc.close()

      loading.value = false
    })
  })
}

function getDownloadFileName() {
  let stylesheet = '_with_annotations_crf_'
  if (data.value.selectedStylesheet === 'falcon') {
    stylesheet = '_falcon_crf_'
  }
  return `${'CRF_Export' + stylesheet + DateTime.local().toFormat('yyyy-MM-dd HH:mm')}`
}

function downloadHtml() {
  exportLoading.value = true
  exportLoader.downloadFile(
    doc.value,
    'text/html',
    getDownloadFileName() + '.html'
  )
  exportLoading.value = false
}

function downloadXml() {
  exportLoading.value = true
  data.value.allowed_namespaces = '&allowed_namespaces=*'
  crfs.getXml(data.value).then((resp) => {
    exportLoader.downloadFile(
      resp.data,
      'text/xml',
      getDownloadFileName() + '.xml'
    )
    exportLoading.value = false
  })
}

function downloadPdf() {
  exportLoading.value = true
  data.value.allowed_namespaces = '&allowed_namespaces=*'
  crfs.getPdf(data.value).then((resp) => {
    exportLoader.downloadFile(
      resp.data,
      'application/pdf',
      getDownloadFileName()
    )
    exportLoading.value = false
  })
}
</script>
<style>
.frame {
  width: 100%;
  min-height: 1000px;
}
</style>
