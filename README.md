# Weather App

A modern, responsive weather application built with Vue 3 and Vuetify that provides real-time weather information and forecasts for cities worldwide.

## Features

- 🌍 Real-time weather data for any city
- 📱 Responsive design that works on all devices
- 🌤️ 5-day weather forecast
- ⏰ Hourly weather updates
- 🌐 Multi-language support (English, German, Spanish, Italian, French, Chinese)
- 🔄 Automatic data refresh every 15 minutes
- 🎨 Dynamic weather-based color themes
- 🔍 Easy city search functionality

## Tech Stack

- Vue 3
- Vuetify 3
- Vue I18n for internationalization
- Vite

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/weather-app-cursor.git
cd weather-app-cursor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

1. Enter a city name in the search bar
2. View current weather conditions including:
   - Temperature
   - Weather description
   - Feels like temperature
   - Humidity
3. Check the hourly forecast for the next 5 hours
4. View the 5-day forecast
5. Switch between different languages using the language selector
6. The app automatically refreshes weather data every 15 minutes

## Project Structure

```
weather-app-cursor/
├── src/
│   ├── components/
│   │   └── CitySearch.vue
│   │   
│   ├── services/
│   │   └── weatherService.js
│   │   
│   ├── i18n/
│   │   └── index.js
│   │   
│   ├── locales/
│   │   ├── en.json
│   │   ├── de.json
│   │   ├── es.json
│   │   ├── it.json
│   │   ├── fr.json
│   │   └── zh.json
│   │   
│   ├── App.vue
│   └── main.js
│   
├── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Vue.js](https://vuejs.org/) for the amazing framework
- [Vuetify](https://vuetifyjs.com/) for the beautiful UI components
