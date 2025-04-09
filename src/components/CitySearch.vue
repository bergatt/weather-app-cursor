<template>
  <v-card class="mb-4">
    <v-card-text>
      <v-form @submit.prevent="handleSubmit" class="w-100">
        <v-row>
          <v-col cols="12" sm="8">
            <v-autocomplete
              v-model="searchQuery"
              :items="cities"
              :label="t('app.search.placeholder')"
              :filter="customFilter"
              :loading="loading"
              :search-input.sync="searchInput"
              append-inner-icon="mdi-magnify"
              @click:append-inner="handleSubmit"
              @keyup.enter="handleSubmit"
              variant="outlined"
              density="comfortable"
              hide-details
              class="w-100"
            ></v-autocomplete>
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  favoriteCities: {
    type: Array,
    default: () => []
  }
})

const { t } = useI18n()
const searchQuery = ref('')
const searchInput = ref('')
const loading = ref(false)
const emit = defineEmits(['search', 'add-favorite', 'remove-favorite'])

// Combine default cities with favorite cities
const cities = computed(() => {
  const defaultCities = [
    'London',
    'New York',
    'Paris',
    'Tokyo',
    'Berlin',
    'Madrid',
    'Rome',
    'Moscow',
    'Beijing',
    'Sydney',
    'Dubai',
    'Singapore',
    'Hong Kong',
    'Amsterdam',
    'Vienna',
    'Barcelona',
    'Mumbai',
    'Seoul',
    'Bangkok',
    'Cairo'
  ]
  return [...new Set([...defaultCities, ...props.favoriteCities])]
})

// Custom filter to match cities that start with the search input
const customFilter = (item, queryText) => {
  const text = item.toLowerCase()
  const query = queryText.toLowerCase()
  return text.startsWith(query)
}

const handleSubmit = () => {
  if (searchQuery.value?.trim()) {
    emit('search', searchQuery.value.trim())
  }
}
</script>

<style scoped>
.w-100 {
  width: 100%;
}
</style> 