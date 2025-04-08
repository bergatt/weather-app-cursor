<template>
  <v-card class="mb-4">
    <v-card-text>
      <v-form @submit.prevent="searchCity">
        <v-row>
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="searchQuery"
              :label="t('app.search.placeholder')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              @keyup.enter="searchCity"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-btn
              color="primary"
              block
              @click="searchCity"
            >
              {{ t('app.search.button') }}
            </v-btn>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const searchQuery = ref('')
const emit = defineEmits(['search'])

const searchCity = () => {
  if (searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim())
  }
}
</script> 