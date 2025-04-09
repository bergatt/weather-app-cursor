<template>
  <div class="search-container">
    <v-card class="mb-4">
      <v-card-text>
        <v-form @submit.prevent="handleSubmit" class="w-100">
          <v-row>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="searchInput"
                :label="t('app.search.placeholder')"
                append-inner-icon="mdi-magnify"
                @click:append-inner="handleSubmit"
                @keyup.enter="handleSubmit"
                variant="outlined"
                density="comfortable"
                hide-details
                class="w-100"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
              <v-btn
                color="primary"
                block
                @click="handleSubmit"
              >
                {{ t('app.search.button') }}
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const emit = defineEmits(['search'])

const searchInput = ref('')

const handleSubmit = () => {
  if (searchInput.value?.trim()) {
    emit('search', searchInput.value.trim())
  }
}
</script>

<style scoped>
.search-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.w-100 {
  width: 100%;
}
</style> 