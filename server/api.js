import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const DIVER_ENV_PATH = path.join(__dirname, '..', 'diver.env');

// Endpoint to save diver information
app.post('/api/diver-info', (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, padiNumber } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !phoneNumber || !padiNumber) {
      return res.status(400).json({ 
        error: 'All fields are required',
        message: 'firstName, lastName, phoneNumber, and padiNumber are required'
      });
    }

    // Create .env format content
    const envContent = `# Diver Information
# Last updated: ${new Date().toISOString()}
DIVER_FIRST_NAME=${firstName}
DIVER_LAST_NAME=${lastName}
DIVER_PHONE_NUMBER=${phoneNumber}
DIVER_PADI_NUMBER=${padiNumber}
`;

    // Write to diver.env file
    fs.writeFileSync(DIVER_ENV_PATH, envContent, 'utf8');

    res.json({ 
      success: true, 
      message: 'Diver information saved successfully',
      data: { firstName, lastName, phoneNumber, padiNumber }
    });
  } catch (error) {
    console.error('Error saving diver info:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Endpoint to get diver information
app.get('/api/diver-info', (req, res) => {
  try {
    if (!fs.existsSync(DIVER_ENV_PATH)) {
      return res.json({ 
        success: true,
        data: null,
        message: 'No diver information found'
      });
    }

    const envContent = fs.readFileSync(DIVER_ENV_PATH, 'utf8');
    const lines = envContent.split('\n');
    const data = {};

    lines.forEach(line => {
      if (line.startsWith('DIVER_')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        
        if (key === 'DIVER_FIRST_NAME') data.firstName = value;
        if (key === 'DIVER_LAST_NAME') data.lastName = value;
        if (key === 'DIVER_PHONE_NUMBER') data.phoneNumber = value;
        if (key === 'DIVER_PADI_NUMBER') data.padiNumber = value;
      }
    });

    res.json({ 
      success: true,
      data: Object.keys(data).length > 0 ? data : null
    });
  } catch (error) {
    console.error('Error reading diver info:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;

// Made with Bob
