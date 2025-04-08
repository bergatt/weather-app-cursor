<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CitySearch from './components/CitySearch.vue'
import { weatherService } from './services/weatherService'

const { t, locale } = useI18n()

const currentWeather = ref(null)
const forecast = ref(null)
const loading = ref(false)
const error = ref(null)
const timeUntilRefresh = ref(15 * 60) // 15 minutes in seconds
let refreshTimer = null
let countdownTimer = null

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'fr', name: 'Français' },
  { code: 'zh', name: '中文' }
]

const startRefreshTimer = () => {
  // Clear existing timers if any
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
  
  // Reset countdown
  timeUntilRefresh.value = 15 * 60
  
  // Start countdown timer
  countdownTimer = setInterval(() => {
    timeUntilRefresh.value--
    if (timeUntilRefresh.value <= 0) {
      timeUntilRefresh.value = 15 * 60
      if (currentWeather.value?.name) {
        fetchWeatherData(currentWeather.value.name)
      }
    }
  }, 1000)
}

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const fetchWeatherData = async (city) => {
  loading.value = true
  error.value = null
  
  try {
    const [current, forecastData] = await Promise.all([
      weatherService.getCurrentWeather(city),
      weatherService.getForecast(city)
    ])
    
    currentWeather.value = current
    forecast.value = forecastData
    
    // Group forecast by day
    const dailyForecast = forecastData.list.reduce((acc, item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = item
      }
      return acc
    }, {})
    
    forecast.value.daily = Object.values(dailyForecast).slice(0, 5)
    
    // Start refresh timer after successful fetch
    startRefreshTimer()
  } catch (err) {
    error.value = t('weather.notFound', { city: err.message })
  } finally {
    loading.value = false
  }
}

const handleSearch = (city) => {
  fetchWeatherData(city)
}

const changeLanguage = (lang) => {
  locale.value = lang
}

const getWeatherColor = (icon) => {
  if (icon.includes('rainy')) return 'blue'
  if (icon.includes('snowy')) return 'grey'
  if (icon.includes('cloudy')) return 'grey-darken-1'
  if (icon.includes('lightning')) return 'deep-purple'
  if (icon.includes('fog')) return 'grey-lighten-1'
  return 'amber'
}

const getWeatherGradient = (icon) => {
  const baseColor = getWeatherColor(icon)
  return `linear-gradient(135deg, var(--v-${baseColor}-base) 0%, var(--v-${baseColor}-darken-1) 100%)`
}

// Clean up timers on component unmount
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})

// Add watch effect for language changes
watch(locale, (newLocale) => {
  document.title = t('app.title')
})

// Update title on initial load
onMounted(() => {
  document.title = t('app.title')
  fetchWeatherData('London')
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary" elevation="4">
      <v-app-bar-title class="text-h5 font-weight-bold">{{ t('app.title') }}</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-select
        v-model="locale"
        :items="languages"
        item-title="name"
        item-value="code"
        density="comfortable"
        hide-details
        class="language-select"
        @update:model-value="changeLanguage"
      ></v-select>
      <div class="d-flex align-center mr-4">
        <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
        <span class="text-caption">{{ formatTime(timeUntilRefresh) }}</span>
      </div>
      <v-btn icon @click="fetchWeatherData(currentWeather?.name)">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-app-bar>

    <v-main class="weather-background">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12" md="4">
            <CitySearch @search="handleSearch" />
          </v-col>
        </v-row>
        
        <v-alert
          v-if="error"
          type="error"
          class="mb-4"
          variant="tonal"
        >
          {{ error }}
        </v-alert>

        <v-progress-circular
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
        ></v-progress-circular>

        <v-row>
          <!-- Current Weather -->
          <v-col cols="12" md="6" lg="4">
            <v-card v-if="currentWeather" class="weather-card current-weather" elevation="4">
              <v-card-title class="text-h5 font-weight-bold">
                {{ currentWeather.name }}, {{ currentWeather.sys.country }}
              </v-card-title>
              <v-card-text>
                <v-row align="center" class="mt-4">
                  <v-col cols="6" class="text-center">
                    <v-icon
                      size="96"
                      :color="getWeatherColor(currentWeather.weather[0].icon)"
                    >
                      {{ currentWeather.weather[0].icon }}
                    </v-icon>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-h2 font-weight-bold">{{ Math.round(currentWeather.main.temp) }}°C</div>
                    <div class="text-h6">{{ currentWeather.weather[0].description }}</div>
                    <v-divider class="my-4"></v-divider>
                    <div class="text-body-1">
                      {{ t('weather.feelsLike') }}: {{ Math.round(currentWeather.main.feels_like) }}°C
                    </div>
                    <div class="text-body-1">
                      {{ t('weather.humidity') }}: {{ currentWeather.main.humidity }}%
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Hourly Forecast -->
          <v-col cols="12" md="6" lg="8">
            <v-card v-if="forecast" class="weather-card" elevation="4">
              <v-card-title class="text-h5 font-weight-bold">{{ t('weather.hourly') }}</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col v-for="item in forecast.list.slice(0, 5)" :key="item.dt" cols="auto">
                    <div class="text-center forecast-item">
                      <div class="text-subtitle-1 font-weight-medium">
                        {{ new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                      </div>
                      <v-icon
                        size="48"
                        :color="getWeatherColor(item.weather[0].icon)"
                        class="my-2"
                      >
                        {{ item.weather[0].icon }}
                      </v-icon>
                      <div class="text-h6">{{ Math.round(item.main.temp) }}°C</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 5-Day Forecast -->
          <v-col cols="12">
            <v-card v-if="forecast" class="weather-card" elevation="4">
              <v-card-title class="text-h5 font-weight-bold">{{ t('weather.daily') }}</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col v-for="item in forecast.daily" :key="item.dt" cols="auto">
                    <div class="text-center forecast-item">
                      <div class="text-subtitle-1 font-weight-medium">
                        {{ t(`weekdays.short.${new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}`) }}
                      </div>
                      <v-icon
                        size="48"
                        :color="getWeatherColor(item.weather[0].icon)"
                        class="my-2"
                      >
                        {{ item.weather[0].icon }}
                      </v-icon>
                      <div class="text-h6">{{ Math.round(item.main.temp) }}°C</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.weather-background {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.weather-card {
  border-radius: 16px;
  transition: transform 0.2s;
  height: 100%;
}

.weather-card:hover {
  transform: translateY(-4px);
}

.current-weather {
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%);
}

.forecast-item {
  padding: 16px;
  min-width: 120px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin: 8px;
  transition: transform 0.2s;
}

.forecast-item:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.9);
}

.language-select {
  max-width: 150px;
  margin-right: 16px;
}

:deep(.v-card-title) {
  padding: 20px;
}

:deep(.v-card-text) {
  padding: 20px;
}
</style>
