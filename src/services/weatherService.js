const BASE_URL = 'https://api.open-meteo.com/v1'
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1'

export const weatherService = {
  async getCurrentWeather(city) {
    try {
      // First, get coordinates for the city
      const geocodingResponse = await fetch(
        `${GEOCODING_URL}/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      )
      if (!geocodingResponse.ok) {
        throw new Error(`Failed to fetch city data: ${geocodingResponse.statusText}`)
      }
      const geocodingData = await geocodingResponse.json()
      
      if (!geocodingData.results?.length) {
        throw new Error(`City "${city}" not found. Please try a different city name.`)
      }

      const { latitude, longitude, name, country } = geocodingData.results[0]

      // Get current weather data
      const weatherResponse = await fetch(
        `${BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      )
      if (!weatherResponse.ok) {
        throw new Error(`Failed to fetch weather data: ${weatherResponse.statusText}`)
      }
      const weatherData = await weatherResponse.json()

      return {
        name,
        sys: { country },
        weather: [{
          description: this.getWeatherDescription(weatherData.current.weather_code),
          icon: this.getWeatherIcon(weatherData.current.weather_code)
        }],
        main: {
          temp: weatherData.current.temperature_2m,
          feels_like: weatherData.current.apparent_temperature,
          humidity: weatherData.current.relative_humidity_2m
        },
        wind: {
          speed: weatherData.current.wind_speed_10m
        }
      }
    } catch (error) {
      console.error('Weather service error:', error)
      throw error
    }
  },

  async getForecast(city) {
    try {
      // First, get coordinates for the city
      const geocodingResponse = await fetch(
        `${GEOCODING_URL}/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
      )
      if (!geocodingResponse.ok) {
        throw new Error(`Failed to fetch city data: ${geocodingResponse.statusText}`)
      }
      const geocodingData = await geocodingResponse.json()
      
      if (!geocodingData.results?.length) {
        throw new Error(`City "${city}" not found. Please try a different city name.`)
      }

      const { latitude, longitude } = geocodingData.results[0]

      // Get forecast data
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      )
      if (!forecastResponse.ok) {
        throw new Error(`Failed to fetch forecast data: ${forecastResponse.statusText}`)
      }
      const forecastData = await forecastResponse.json()

      return {
        list: forecastData.hourly.time.map((time, index) => ({
          dt: new Date(time).getTime() / 1000,
          main: {
            temp: forecastData.hourly.temperature_2m[index],
            feels_like: forecastData.hourly.apparent_temperature[index],
            humidity: forecastData.hourly.relative_humidity_2m[index]
          },
          weather: [{
            description: this.getWeatherDescription(forecastData.hourly.weather_code[index]),
            icon: this.getWeatherIcon(forecastData.hourly.weather_code[index])
          }]
        })),
        daily: forecastData.daily.time.map((time, index) => ({
          dt: new Date(time).getTime() / 1000,
          main: {
            temp: (forecastData.daily.temperature_2m_max[index] + forecastData.daily.temperature_2m_min[index]) / 2
          },
          weather: [{
            description: this.getWeatherDescription(forecastData.daily.weather_code[index]),
            icon: this.getWeatherIcon(forecastData.daily.weather_code[index])
          }]
        }))
      }
    } catch (error) {
      console.error('Forecast service error:', error)
      throw error
    }
  },

  async getCurrentWeatherByCoords(latitude, longitude) {
    try {
      // Get current weather data
      const weatherResponse = await fetch(
        `${BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`
      )
      if (!weatherResponse.ok) {
        throw new Error(`Failed to fetch weather data: ${weatherResponse.statusText}`)
      }
      const weatherData = await weatherResponse.json()

      // Get city name from coordinates
      const geocodingResponse = await fetch(
        `${GEOCODING_URL}/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`
      )
      if (!geocodingResponse.ok) {
        throw new Error(`Failed to fetch location data: ${geocodingResponse.statusText}`)
      }
      const geocodingData = await geocodingResponse.json()
      
      const name = geocodingData.results?.[0]?.name || 'Current Location'
      const country = geocodingData.results?.[0]?.country || ''

      return {
        name,
        sys: { country },
        weather: [{
          description: this.getWeatherDescription(weatherData.current.weather_code),
          icon: this.getWeatherIcon(weatherData.current.weather_code)
        }],
        main: {
          temp: weatherData.current.temperature_2m,
          feels_like: weatherData.current.apparent_temperature,
          humidity: weatherData.current.relative_humidity_2m
        },
        wind: {
          speed: weatherData.current.wind_speed_10m
        }
      }
    } catch (error) {
      console.error('Weather service error:', error)
      throw error
    }
  },

  async getForecastByCoords(latitude, longitude) {
    try {
      // Get forecast data
      const forecastResponse = await fetch(
        `${BASE_URL}/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code,relative_humidity_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`
      )
      if (!forecastResponse.ok) {
        throw new Error(`Failed to fetch forecast data: ${forecastResponse.statusText}`)
      }
      const forecastData = await forecastResponse.json()

      return {
        list: forecastData.hourly.time.map((time, index) => ({
          dt: new Date(time).getTime() / 1000,
          main: {
            temp: forecastData.hourly.temperature_2m[index],
            feels_like: forecastData.hourly.apparent_temperature[index],
            humidity: forecastData.hourly.relative_humidity_2m[index]
          },
          weather: [{
            description: this.getWeatherDescription(forecastData.hourly.weather_code[index]),
            icon: this.getWeatherIcon(forecastData.hourly.weather_code[index])
          }]
        })),
        daily: forecastData.daily.time.map((time, index) => ({
          dt: new Date(time).getTime() / 1000,
          main: {
            temp: (forecastData.daily.temperature_2m_max[index] + forecastData.daily.temperature_2m_min[index]) / 2
          },
          weather: [{
            description: this.getWeatherDescription(forecastData.daily.weather_code[index]),
            icon: this.getWeatherIcon(forecastData.daily.weather_code[index])
          }]
        }))
      }
    } catch (error) {
      console.error('Forecast service error:', error)
      throw error
    }
  },

  getWeatherIcon(code) {
    // WMO Weather interpretation codes
    const icons = {
      0: 'mdi-weather-sunny', // Clear sky
      1: 'mdi-weather-partly-cloudy', // Mainly clear
      2: 'mdi-weather-partly-cloudy', // Partly cloudy
      3: 'mdi-weather-cloudy', // Overcast
      45: 'mdi-weather-fog', // Fog
      48: 'mdi-weather-fog', // Depositing rime fog
      51: 'mdi-weather-partly-rainy', // Light drizzle
      53: 'mdi-weather-partly-rainy', // Moderate drizzle
      55: 'mdi-weather-partly-rainy', // Dense drizzle
      61: 'mdi-weather-rainy', // Slight rain
      63: 'mdi-weather-rainy', // Moderate rain
      65: 'mdi-weather-pouring', // Heavy rain
      71: 'mdi-weather-snowy', // Slight snow fall
      73: 'mdi-weather-snowy', // Moderate snow fall
      75: 'mdi-weather-snowy-heavy', // Heavy snow fall
      77: 'mdi-weather-snowy', // Snow grains
      80: 'mdi-weather-partly-rainy', // Slight rain showers
      81: 'mdi-weather-rainy', // Moderate rain showers
      82: 'mdi-weather-pouring', // Violent rain showers
      85: 'mdi-weather-snowy', // Slight snow showers
      86: 'mdi-weather-snowy-heavy', // Heavy snow showers
      95: 'mdi-weather-lightning-rainy', // Thunderstorm
      96: 'mdi-weather-lightning-rainy', // Thunderstorm with slight hail
      99: 'mdi-weather-lightning-rainy' // Thunderstorm with heavy hail
    }
    return icons[code] || 'mdi-weather-cloudy'
  },

  getWeatherDescription(code) {
    // WMO Weather interpretation codes
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    }
    return descriptions[code] || 'Unknown'
  },

  async searchCities(query) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${this.apiKey}`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch city suggestions')
      }
      return await response.json()
    } catch (error) {
      console.error('Error searching cities:', error)
      return []
    }
  }
} 