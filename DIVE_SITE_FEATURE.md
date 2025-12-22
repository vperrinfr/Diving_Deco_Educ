# Dive Site Feature - Implementation Summary

## Overview
A comprehensive dive site management page has been added to the decompression calculator application. This feature allows divers to configure and save dive site information including location, water conditions, and real-time weather data.

## Features Implemented

### 1. Dive Site Information
- **Site Name**: Custom naming for each dive site
- **Water Type**: Selection between Sea, Lake, River, or Quarry
- **Location**: Latitude and longitude coordinates
- **Address**: Optional address field
- **Altitude**: Meters above sea level (affects decompression calculations)
- **Water Temperature**: Manual input or automatic estimation

### 2. Weather Integration (Open-Meteo API)
Real-time weather data fetching including:
- Air temperature
- Wind speed and direction
- Wave height (for marine locations)
- Precipitation
- Cloud cover
- Atmospheric pressure
- Humidity
- Weather conditions (clear, cloudy, rain, etc.)

### 3. Data Persistence
- Save multiple dive sites to browser localStorage
- Load previously saved sites
- Delete saved sites
- Auto-refresh weather data when loading a site

### 4. Multilingual Support
Full translations in French and English for:
- All form labels and buttons
- Weather conditions
- Validation messages
- Information tooltips

## Technical Implementation

### Files Created

1. **src/types/diveSite.ts**
   - TypeScript interfaces for dive sites and weather conditions
   - WMO weather code descriptions (multilingual)

2. **src/services/weatherService.ts**
   - Integration with Open-Meteo API (free, open-source weather API)
   - Marine API integration for wave data
   - Water temperature estimation algorithm
   - Error handling and fallbacks

3. **src/stores/diveSiteStore.ts**
   - Pinia store for state management
   - CRUD operations for dive sites
   - Weather data fetching and caching
   - localStorage integration

4. **src/views/DiveSitePage.vue**
   - Complete UI with form inputs
   - Real-time weather display
   - Saved sites management
   - Responsive design with Tailwind CSS

### Files Modified

1. **src/router/index.ts**
   - Added `/dive-site` route

2. **src/views/HomePage.vue**
   - Added "Dive Site" button to homepage
   - Button group styling

3. **src/i18n/locales/fr.json** & **en.json**
   - Added complete translations for dive site feature

## API Integration

### Open-Meteo API
- **Endpoint**: https://api.open-meteo.com/v1/forecast
- **Features**: Free, no API key required, open-source
- **Data**: Temperature, wind, precipitation, pressure, humidity, cloud cover
- **Marine API**: Wave height and direction (when available)

### Weather Code Interpretation
Uses WMO (World Meteorological Organization) weather codes with human-readable descriptions in both French and English.

## Usage

1. **Navigate to Dive Site Page**
   - Click "Lieu de plongée" / "Dive Site" button on homepage
   - Or navigate directly to `/dive-site`

2. **Enter Site Information**
   - Fill in site name, water type, and location coordinates
   - Set altitude and water temperature
   - Optionally add an address

3. **Fetch Weather Data**
   - Click "Récupérer la météo" / "Fetch Weather"
   - Real-time weather conditions will be displayed
   - Water temperature can be auto-estimated based on air temperature

4. **Save Site**
   - Click "Enregistrer le site" / "Save Site"
   - Site is saved to browser localStorage
   - Can be loaded later from the saved sites list

## Water Temperature Estimation

When "Use estimated temperature" is enabled, the system estimates water temperature based on:
- Current air temperature
- Season (month of the year)
- Water body type (sea, lake, river, quarry)
- Thermal inertia factors

This is a rough estimation - actual measurements are always preferred.

## Altitude Considerations

The altitude field is important for decompression calculations:
- Sea level: 0 meters
- Mountain lakes: Higher altitude requires adjusted decompression tables
- The calculator can use this data for more accurate dive planning

## Future Enhancements

Potential improvements:
- Integration with dive calculator for automatic parameter adjustment
- Historical weather data and trends
- Tide information for coastal sites
- Current speed and direction (requires additional API)
- Photo upload for dive sites
- Community sharing of dive sites
- GPS location detection
- Map view of dive sites

## Browser Compatibility

- Modern browsers with localStorage support
- Responsive design for mobile and desktop
- Works offline after initial load (weather requires internet)

## Credits

- Weather data: Open-Meteo (https://open-meteo.com/)
- Built with Vue 3, TypeScript, Pinia, and Tailwind CSS
- Made with Bob