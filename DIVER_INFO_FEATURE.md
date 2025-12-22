# Diver Information Feature

## Overview

This feature allows users to enter and save their diver information (Name, First Name, Phone Number, PADI Number) through a modal dialog. The information is stored both locally in the browser's localStorage and on the server in a `diver.env` file.

## Features

- **Modal Dialog**: Clean, accessible modal for entering diver information
- **Form Validation**: All fields are required with proper validation
- **Dual Storage**: Data saved in both localStorage (client) and diver.env file (server)
- **Multi-language Support**: Available in French and English
- **Accessible from Multiple Pages**: Button available on Home page and Dive Site page

## User Interface

### Diver Info Button
A user icon button (👤) is located in the header next to the help button (?). Clicking this button opens the diver information modal.

### Modal Fields
1. **Prénom / First Name** - Required
2. **Nom / Last Name** - Required
3. **Numéro de téléphone / Phone Number** - Required (validates phone format)
4. **Numéro PADI / PADI Number** - Required

### Actions
- **Enregistrer / Save**: Saves the information
- **Annuler / Cancel**: Closes the modal without saving

## Technical Implementation

### Frontend Components

#### DiverInfoModal.vue
Location: `src/components/common/DiverInfoModal.vue`

Features:
- Vue 3 Composition API
- Form validation
- localStorage integration
- API communication
- Teleport for proper modal rendering
- Smooth transitions

#### Integration Points
- `src/views/HomePage.vue` - Diver info button in header
- `src/views/DiveSitePage.vue` - Diver info button in header

### Backend API

#### API Server
Location: `server/api.js`

Endpoints:
- `POST /api/diver-info` - Save diver information
- `GET /api/diver-info` - Retrieve diver information

The API saves data to `diver.env` file in the project root.

### Data Storage

#### diver.env Format
```env
# Diver Information
# Last updated: 2025-12-22T15:30:00.000Z
DIVER_FIRST_NAME=John
DIVER_LAST_NAME=Doe
DIVER_PHONE_NUMBER=+33 6 12 34 56 78
DIVER_PADI_NUMBER=1234567
```

**Note**: The `diver.env` file is automatically added to `.gitignore` to protect sensitive information.

## Installation & Setup

### 1. Install Dependencies

The project already has all necessary dependencies. If you need to reinstall:

```bash
npm install
```

For the API server, you'll need Express.js:

```bash
npm install express
```

### 2. Running the Application

#### Option A: Frontend Only (Development)
```bash
npm run dev
```
This runs only the Vite dev server. The modal will work but API calls will fail gracefully, falling back to localStorage only.

#### Option B: Frontend + API Server (Full Functionality)

**Terminal 1 - Start API Server:**
```bash
npm run dev:api
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

#### Option C: Both Simultaneously (Recommended)
```bash
npm run dev:all
```
This requires the `concurrently` package:
```bash
npm install --save-dev concurrently
```

### 3. Access the Application

- Frontend: http://localhost:5173
- API Server: http://localhost:3001

## Usage

1. Navigate to the Home page or Dive Site page
2. Click the user icon (👤) button in the top-right header
3. Fill in all required fields:
   - First Name
   - Last Name
   - Phone Number
   - PADI Number
4. Click "Enregistrer" / "Save"
5. The information is saved to both localStorage and the server

## Data Persistence

### Client-Side (localStorage)
- Key: `diver-info`
- Format: JSON object
- Persists across browser sessions
- Automatically loaded when modal opens

### Server-Side (diver.env)
- Location: Project root directory
- Format: Environment variable format
- Includes timestamp of last update
- Protected by .gitignore

## Translations

All text is internationalized using vue-i18n:

### French (fr.json)
```json
{
  "diverInfo": {
    "title": "Informations du plongeur",
    "firstName": "Prénom",
    "lastName": "Nom",
    "phoneNumber": "Numéro de téléphone",
    "padiNumber": "Numéro PADI",
    ...
  }
}
```

### English (en.json)
```json
{
  "diverInfo": {
    "title": "Diver Information",
    "firstName": "First Name",
    "lastName": "Last Name",
    "phoneNumber": "Phone Number",
    "padiNumber": "PADI Number",
    ...
  }
}
```

## Security Considerations

1. **Sensitive Data**: The `diver.env` file contains personal information and is excluded from version control
2. **Validation**: All inputs are validated on both client and server
3. **HTTPS**: In production, ensure API calls use HTTPS
4. **Access Control**: Consider adding authentication for the API endpoints in production

## Future Enhancements

Potential improvements:
- [ ] Add certification level field
- [ ] Add emergency contact information
- [ ] Export diver info to PDF
- [ ] Integration with dive log
- [ ] Multiple diver profiles support
- [ ] Data encryption for sensitive information
- [ ] API authentication/authorization

## Troubleshooting

### Modal doesn't open
- Check browser console for errors
- Verify DiverInfoModal component is properly imported

### Data not saving to server
- Ensure API server is running (`npm run dev:api`)
- Check API server console for errors
- Verify proxy configuration in `vite.config.ts`

### Form validation errors
- All fields are required
- Phone number must contain only digits, spaces, +, -, (, )
- Check browser console for specific validation messages

## Files Modified/Created

### New Files
- `src/components/common/DiverInfoModal.vue` - Modal component
- `server/api.js` - API server
- `DIVER_INFO_FEATURE.md` - This documentation

### Modified Files
- `src/views/HomePage.vue` - Added diver info button
- `src/views/DiveSitePage.vue` - Added diver info button
- `src/i18n/locales/fr.json` - Added French translations
- `src/i18n/locales/en.json` - Added English translations
- `vite.config.ts` - Added API proxy configuration
- `package.json` - Added API server scripts
- `.gitignore` - Added diver.env exclusion

## Support

For issues or questions, please refer to the main project documentation or create an issue in the project repository.