// server.js

// Load environment variables dari file .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// Import middleware dan routes
const apiKeyAuth = require('./middleware/apiKeyAuth');
const sensorRoutes = require('./routes/sensorRoutes');

// Inisialisasi Express
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware Global ---

// Mengizinkan akses dari domain manapun (CORS)
app.use(cors());

// Parsing body request dalam format JSON
app.use(express.json());

// Parsing body request dalam format URL-encoded
app.use(express.urlencoded({ extended: true }));

// --- Routes ---

// Root endpoint (tidak butuh API Key)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Server Monitoring Sensor berjalan',
        version: '1.0.0',
        endpoints: {
            getAllSensors: 'GET /api/sensors',
            getSensorById: 'GET /api/sensors/:id',
            createSensor: 'POST /api/sensors',
            updateSensor: 'PUT /api/sensors/:id',
            patchSensor: 'PATCH /api/sensors/:id',
            deleteSensor: 'DELETE /api/sensors/:id',
            updateNilai: 'POST /api/update',
            batchUpdate: 'POST /api/batch-update'
        },
        note: 'Semua endpoint /api membutuhkan API Key di header x-api-key'
    });
});

// Terapkan API Key Auth untuk semua route /api
app.use('/api', apiKeyAuth);

// Route sensor
app.use('/api/sensors', sensorRoutes);

// Endpoint khusus update nilai sensor (di bawah /api)
app.use('/api', sensorRoutes);

// --- Error Handling ---

// Middleware untuk menangani route yang tidak ditemukan
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.url} tidak ditemukan`
    });
});

// Middleware untuk menangani error server
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server'
    });
});

// --- Jalankan Server ---

app.listen(PORT, () => {
    console.log('=================================');
    console.log('🚀 Server Monitoring Sensor');
    console.log(`📍 Berjalan di http://localhost:${PORT}`);
    console.log('=================================');
    console.log('📋 Endpoint tersedia:');
    console.log(`   Root API : http://localhost:${PORT}/`);
    console.log(`   Sensors  : http://localhost:${PORT}/api/sensors`);
    console.log(`   Update   : http://localhost:${PORT}/api/update`);
    console.log('=================================');
    console.log('⚠️  Jangan lupa set API Key di header x-api-key');
    console.log('=================================');
});