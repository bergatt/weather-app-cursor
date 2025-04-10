<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CitySearch from './components/CitySearch.vue'
import { weatherService } from './services/weatherService'

const { t, locale } = useI18n()

// Initialize locale from localStorage or default to 'en'
const savedLocale = localStorage.getItem('weatherAppLocale') || 'en'
locale.value = savedLocale

// Initialize favorite cities from localStorage
const favoriteCities = ref(JSON.parse(localStorage.getItem('favoriteCities') || '[]'))

const currentWeather = ref(null)
const forecast = ref(null)
const loading = ref(false)
const error = ref(null)
const timeUntilRefresh = ref(5 * 60) // 5 minutes in seconds
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
  timeUntilRefresh.value = 5 * 60
  
  // Start countdown timer
  countdownTimer = setInterval(() => {
    timeUntilRefresh.value--
    if (timeUntilRefresh.value <= 0) {
      timeUntilRefresh.value = 5 * 60
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
    
    forecast.value.daily = Object.values(dailyForecast).slice(0, 7)
    
    // Start refresh timer after successful fetch
    startRefreshTimer()
  } catch (err) {
    error.value = t('weather.notFound', { city: err.message })
  } finally {
    loading.value = false
  }
}

const getCurrentLocation = () => {
  loading.value = true
  error.value = null
  
  if (!navigator.geolocation) {
    // Fallback to London if geolocation is not supported
    fetchWeatherData('London')
    return
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords
        const [current, forecastData] = await Promise.all([
          weatherService.getCurrentWeatherByCoords(latitude, longitude),
          weatherService.getForecastByCoords(latitude, longitude)
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
        
        forecast.value.daily = Object.values(dailyForecast).slice(0, 7)
        
        // Start refresh timer after successful fetch
        startRefreshTimer()
      } catch (err) {
        // Fallback to London if there's an error getting weather data
        fetchWeatherData('London')
      } finally {
        loading.value = false
      }
    },
    (err) => {
      // Fallback to London if user denies permission or there's a geolocation error
      fetchWeatherData('London')
      loading.value = false
    },
    { timeout: 5000 } // Add a 5-second timeout
  )
}

const handleSearch = (city) => {
  if (!city) return
  console.log('Searching for city:', city)
  fetchWeatherData(city)
}

const changeLanguage = (lang) => {
  locale.value = lang
}

const getWeatherColor = (icon, dt, applyDayNight = true) => {
  // If we don't need to apply day/night differentiation, use default colors
  if (!applyDayNight) {
    const defaultColors = {
      'mdi-weather-rainy': 'blue',
      'mdi-weather-pouring': 'blue-darken-1',
      'mdi-weather-snowy': 'grey',
      'mdi-weather-cloudy': 'grey-darken-1',
      'mdi-weather-lightning': 'deep-purple',
      'mdi-weather-fog': 'grey-lighten-1',
      'mdi-weather-night': 'indigo'
    }
    
    // Check for specific weather conditions
    for (const [key, color] of Object.entries(defaultColors)) {
      if (icon.includes(key)) return color
    }
    
    // Default color for sunny/clear weather
    return 'amber'
  }
  
  const isDaytime = isDayTime(dt)
  
  // Base colors for different weather conditions
  const colors = {
    sunny: isDaytime ? 'amber' : 'indigo',
    cloudy: isDaytime ? 'grey-darken-1' : 'grey-darken-2',
    rainy: isDaytime ? 'blue' : 'blue-darken-2',
    pouring: isDaytime ? 'blue-darken-1' : 'blue-darken-3',
    snowy: isDaytime ? 'grey' : 'grey-darken-1',
    lightning: isDaytime ? 'deep-purple' : 'deep-purple-darken-2',
    fog: isDaytime ? 'grey-lighten-1' : 'grey',
    night: 'indigo'
  }
  
  // Check for specific weather conditions
  if (icon.includes('mdi-weather-rainy')) return colors.rainy
  if (icon.includes('mdi-weather-pouring')) return colors.pouring
  if (icon.includes('mdi-weather-snowy')) return colors.snowy
  if (icon.includes('mdi-weather-cloudy')) return colors.cloudy
  if (icon.includes('mdi-weather-lightning')) return colors.lightning
  if (icon.includes('mdi-weather-fog')) return colors.fog
  if (icon.includes('mdi-weather-night')) return colors.night
  
  // Default colors for sunny/clear weather
  return colors.sunny
}

const getWeatherGradient = (icon) => {
  const baseColor = getWeatherColor(icon)
  return `linear-gradient(135deg, var(--v-${baseColor}-base) 0%, var(--v-${baseColor}-darken-1) 100%)`
}

const addToFavorites = (city) => {
  if (!favoriteCities.value.includes(city)) {
    favoriteCities.value.push(city)
    localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities.value))
  }
}

const removeFromFavorites = (city) => {
  favoriteCities.value = favoriteCities.value.filter(c => c !== city)
  localStorage.setItem('favoriteCities', JSON.stringify(favoriteCities.value))
}

const isFavorite = (city) => {
  return favoriteCities.value.includes(city)
}

const getWeatherIcon = (icon, dt, applyDayNight = true) => {
  // If we don't need to apply day/night differentiation, return the icon as is
  if (!applyDayNight) {
    return icon
  }
  
  // Check if it's day or night
  const isDaytime = isDayTime(dt)
  
  // Map of day icons to their night equivalents
  const dayToNightMap = {
    'mdi-weather-sunny': 'mdi-weather-night',
    'mdi-weather-partly-cloudy': 'mdi-weather-night-partly-cloudy',
    'mdi-weather-cloudy': 'mdi-weather-cloudy', // Same for both
    'mdi-weather-rainy': 'mdi-weather-rainy', // Same for both
    'mdi-weather-pouring': 'mdi-weather-pouring', // Same for both
    'mdi-weather-lightning-rainy': 'mdi-weather-lightning-rainy', // Same for both
    'mdi-weather-snowy': 'mdi-weather-snowy', // Same for both
    'mdi-weather-fog': 'mdi-weather-fog' // Same for both
  }
  
  // If it's night and we have a night version of this icon, use it
  if (!isDaytime && dayToNightMap[icon]) {
    return dayToNightMap[icon]
  }
  
  // Otherwise return the original icon
  return icon
}

const isDayTime = (dt) => {
  if (!dt) return true // Default to daytime if no timestamp provided
  
  const date = new Date(dt * 1000)
  const hours = date.getHours()
  
  // Consider daytime between 6 AM and 6 PM
  return hours >= 6 && hours < 18
}

const getNextHoursForecast = (forecastList) => {
  if (!forecastList || forecastList.length === 0) return []
  
  const now = new Date().getTime() / 1000 // Convert to seconds to match forecast timestamps
  const currentIndex = forecastList.findIndex(item => item.dt >= now)
  
  // If we can't find a future forecast, return the first 6 items
  if (currentIndex === -1) return forecastList.slice(0, 6)
  
  // Return the next 6 hours starting from the current time
  return forecastList.slice(currentIndex, currentIndex + 6)
}

// Clean up timers on component unmount
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  if (countdownTimer) clearInterval(countdownTimer)
})

// Add watch effect for language changes
watch(locale, (newLocale) => {
  document.title = t('app.title')
  // Save language preference to localStorage
  localStorage.setItem('weatherAppLocale', newLocale)
})

// Update title on initial load
onMounted(() => {
  document.title = t('app.title')
  // Try to get current location first, fall back to London if denied
  getCurrentLocation()
})
</script>

<template>
  <v-app>
    <v-app-bar color="primary" elevation="4">
      <v-container class="d-flex align-center">
        <v-icon
          icon="mdi-weather-partly-cloudy"
          size="32"
          class="mr-2"
        ></v-icon>
        <span class="text-h5 font-weight-bold">{{ t('app.title') }}</span>
        <v-spacer></v-spacer>
        <v-btn icon @click="getCurrentLocation" class="mr-2" title="Get current location">
          <v-icon>mdi-crosshairs-gps</v-icon>
        </v-btn>
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
      </v-container>
    </v-app-bar>

    <v-main class="weather-background">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <CitySearch 
              @search="handleSearch"
            />
          </v-col>
        </v-row>
        
        <!-- Favorite Cities -->
        <v-row v-if="favoriteCities.length > 0" class="mb-4">
          <v-col cols="12">
            <v-card class="weather-card favorites-card" elevation="4">
              <v-card-title class="text-h5 font-weight-bold">
                {{ t('app.favorites') }}
              </v-card-title>
              <v-card-text>
                <v-chip-group>
                  <v-chip
                    v-for="city in favoriteCities"
                    :key="city"
                    closable
                    @click="fetchWeatherData(city)"
                    @click:close="removeFromFavorites(city)"
                    class="favorite-chip"
                  >
                    {{ city }}
                  </v-chip>
                </v-chip-group>
              </v-card-text>
            </v-card>
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
                      :color="getWeatherColor(currentWeather.weather[0].icon, currentWeather.dt)"
                    >
                      {{ getWeatherIcon(currentWeather.weather[0].icon, currentWeather.dt) }}
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
                <div class="hourly-forecast-container">
                  <v-row>
                    <v-col v-for="item in getNextHoursForecast(forecast?.list)" :key="item.dt" cols="auto">
                      <div class="text-center forecast-item">
                        <div class="text-subtitle-1 font-weight-medium">
                          {{ new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }}
                        </div>
                        <v-icon
                          size="48"
                          :color="getWeatherColor(item.weather[0].icon, item.dt)"
                          class="my-2"
                        >
                          {{ getWeatherIcon(item.weather[0].icon, item.dt) }}
                        </v-icon>
                        <div class="text-h6">{{ Math.round(item.main.temp) }}°C</div>
                      </div>
                    </v-col>
                  </v-row>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- 7-Day Forecast -->
          <v-col cols="12">
            <v-card v-if="forecast" class="weather-card" elevation="4">
              <v-card-title class="text-h5 font-weight-bold">{{ t('weather.weekly') }}</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col v-for="item in forecast.daily" :key="item.dt" cols="auto">
                    <div class="text-center forecast-item">
                      <div class="text-subtitle-1 font-weight-medium">
                        {{ t(`weekdays.short.${new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}`) }}
                      </div>
                      <v-icon
                        size="48"
                        :color="getWeatherColor(item.weather[0].icon, item.dt, false)"
                        class="my-2"
                      >
                        {{ getWeatherIcon(item.weather[0].icon, item.dt, false) }}
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
  position: relative;
  overflow: hidden;
}

.weather-background::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: pulse 8s ease-in-out infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.5); opacity: 0.2; }
  100% { transform: scale(1); opacity: 0.5; }
}

.weather-card {
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.weather-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.current-weather {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 247, 250, 0.95) 100%);
  position: relative;
  overflow: hidden;
}

.current-weather::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, transparent 60%);
  animation: rotate 20s linear infinite;
  pointer-events: none;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.forecast-item {
  padding: 12px;
  min-width: 80px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin: 8px;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.forecast-item:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.hourly-forecast-container {
  overflow-x: auto;
  padding-bottom: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.hourly-forecast-container::-webkit-scrollbar {
  height: 6px;
}

.hourly-forecast-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.hourly-forecast-container::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.hourly-forecast-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.language-select {
  max-width: 150px;
  margin-right: 16px;
  transition: transform 0.2s;
}

.language-select:hover {
  transform: scale(1.05);
}

:deep(.v-card-title) {
  padding: 20px;
  position: relative;
  overflow: hidden;
}

:deep(.v-card-title)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--v-primary-base), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

:deep(.v-card-text) {
  padding: 20px;
}

:deep(.v-icon) {
  transition: transform 0.3s ease;
}

:deep(.v-icon:hover) {
  transform: scale(1.2) rotate(10deg);
}

:deep(.v-btn) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.v-btn:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Add smooth page transitions */
.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

/* Add loading animation */
.v-progress-circular {
  animation: pulse 2s ease-in-out infinite;
}

/* Add text shadow effects */
.text-h2 {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.text-h5 {
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.favorites-card {
  margin-bottom: 16px;
}

.favorite-chip {
  cursor: pointer;
  transition: all 0.3s ease;
}

.favorite-chip:hover {
  transform: scale(1.05);
  background-color: var(--v-primary-base) !important;
  color: white !important;
}
</style>
