// routes/sensorRoutes.js

const express = require('express');
const router = express.Router();

/**
 * Data Sensor awal
 * Disimpan dalam array JavaScript
 * 
 * Struktur data setiap sensor:
 * - id: identifier unik
 * - namaSensor: nama sensor
 * - nilai: nilai pengukuran
 * - satuan: satuan nilai
 * - waktuUpdate: waktu terakhir update
 */

let sensors = [
    {
        id: 1,
        namaSensor: 'Suhu',
        nilai: 25.5,
        satuan: '°C',
        waktuUpdate: new Date().toISOString()
    },
    {
        id: 2,
        namaSensor: 'Kelembapan',
        nilai: 75.0,
        satuan: '%',
        waktuUpdate: new Date().toISOString()
    },
    {
        id: 3,
        namaSensor: 'Tekanan',
        nilai: 1013.2,
        satuan: 'hPa',
        waktuUpdate: new Date().toISOString()
    }
];

// Variable untuk auto-increment ID
let nextId = 4;

/**
 * GET /api/sensors
 * Mendapatkan semua data sensor
 */
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Data sensor berhasil diambil',
        total: sensors.length,
        data: sensors
    });
});

/**
 * GET /api/sensors/:id
 * Mendapatkan sensor berdasarkan ID
 */
router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Cari sensor berdasarkan ID
    const sensor = sensors.find(s => s.id === id);
    
    // Jika tidak ditemukan
    if (!sensor) {
        return res.status(404).json({
            success: false,
            message: `Sensor dengan ID ${id} tidak ditemukan`
        });
    }
    
    res.json({
        success: true,
        message: 'Data sensor berhasil diambil',
        data: sensor
    });
});

/**
 * POST /api/sensors
 * Menambahkan sensor baru
 */
router.post('/', (req, res) => {
    const { namaSensor, nilai, satuan } = req.body;
    
    // Validasi input
    if (!namaSensor || !nilai || !satuan) {
        return res.status(400).json({
            success: false,
            message: 'Data tidak lengkap. Harap isi namaSensor, nilai, dan satuan'
        });
    }
    
    // Buat sensor baru
    const sensorBaru = {
        id: nextId++,
        namaSensor,
        nilai: parseFloat(nilai),
        satuan,
        waktuUpdate: new Date().toISOString()
    };
    
    // Tambahkan ke array
    sensors.push(sensorBaru);
    
    res.status(201).json({
        success: true,
        message: 'Sensor berhasil ditambahkan',
        data: sensorBaru
    });
});

/**
 * PUT /api/sensors/:id
 * Memperbarui seluruh data sensor berdasarkan ID
 */
router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { namaSensor, nilai, satuan } = req.body;
    
    // Cari index sensor
    const index = sensors.findIndex(s => s.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: `Sensor dengan ID ${id} tidak ditemukan`
        });
    }
    
    // Validasi input
    if (!namaSensor || !nilai || !satuan) {
        return res.status(400).json({
            success: false,
            message: 'Data tidak lengkap. Harap isi namaSensor, nilai, dan satuan'
        });
    }
    
    // Update seluruh data
    sensors[index] = {
        id,
        namaSensor,
        nilai: parseFloat(nilai),
        satuan,
        waktuUpdate: new Date().toISOString()
    };
    
    res.json({
        success: true,
        message: 'Sensor berhasil diperbarui',
        data: sensors[index]
    });
});

/**
 * PATCH /api/sensors/:id
 * Memperbarui sebagian data sensor
 */
router.patch('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    // Cari sensor
    const sensor = sensors.find(s => s.id === id);
    
    if (!sensor) {
        return res.status(404).json({
            success: false,
            message: `Sensor dengan ID ${id} tidak ditemukan`
        });
    }
    
    // Update hanya field yang dikirim
    if (updates.namaSensor) sensor.namaSensor = updates.namaSensor;
    if (updates.nilai !== undefined) sensor.nilai = parseFloat(updates.nilai);
    if (updates.satuan) sensor.satuan = updates.satuan;
    
    // Update waktu
    sensor.waktuUpdate = new Date().toISOString();
    
    res.json({
        success: true,
        message: 'Sensor berhasil diperbarui sebagian',
        data: sensor
    });
});

/**
 * DELETE /api/sensors/:id
 * Menghapus sensor berdasarkan ID
 */
router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    // Cari index
    const index = sensors.findIndex(s => s.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: `Sensor dengan ID ${id} tidak ditemukan`
        });
    }
    
    // Hapus sensor
    const deletedSensor = sensors.splice(index, 1)[0];
    
    res.json({
        success: true,
        message: 'Sensor berhasil dihapus',
        data: deletedSensor
    });
});

/**
 * POST /api/update
 * Endpoint khusus untuk update nilai sensor
 * 
 * Menerima body:
 * {
 *   "sensor": "Suhu",     // nama sensor
 *   "nilai": 29.7         // nilai baru
 * }
 */
router.post('/update', (req, res) => {
    const { sensor, nilai } = req.body;
    
    // Validasi input
    if (!sensor || nilai === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Data tidak lengkap. Harap isi sensor dan nilai'
        });
    }
    
    // Cari sensor berdasarkan nama
    const foundSensor = sensors.find(
        s => s.namaSensor.toLowerCase() === sensor.toLowerCase()
    );
    
    if (!foundSensor) {
        return res.status(404).json({
            success: false,
            message: `Sensor "${sensor}" tidak ditemukan. Sensor tersedia: Suhu, Kelembapan, Tekanan`
        });
    }
    
    // Update nilai dan waktu
    foundSensor.nilai = parseFloat(nilai);
    foundSensor.waktuUpdate = new Date().toISOString();
    
    res.json({
        success: true,
        message: `Nilai sensor ${sensor} berhasil diperbarui menjadi ${nilai} ${foundSensor.satuan}`,
        data: foundSensor
    });
});

/**
 * POST /api/batch-update
 * Update banyak sensor sekaligus
 * 
 * Menerima body:
 * {
 *   "sensors": [
 *     {"sensor": "Suhu", "nilai": 29.7},
 *     {"sensor": "Kelembapan", "nilai": 82.5},
 *     {"sensor": "Tekanan", "nilai": 1005.3}
 *   ]
 * }
 */
router.post('/batch-update', (req, res) => {
    const { sensors: sensorsToUpdate } = req.body;
    
    // Validasi input
    if (!sensorsToUpdate || !Array.isArray(sensorsToUpdate) || sensorsToUpdate.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Format tidak valid. Kirim dalam format: { "sensors": [{"sensor": "Nama", "nilai": 123}, ...] }'
        });
    }
    
    const results = {
        success: [],
        failed: []
    };
    
    // Proses setiap sensor
    sensorsToUpdate.forEach(item => {
        const { sensor, nilai } = item;
        
        // Validasi setiap item
        if (!sensor || nilai === undefined) {
            results.failed.push({
                sensor: sensor || 'unknown',
                reason: 'Data tidak lengkap (butuh sensor dan nilai)'
            });
            return;
        }
        
        // Cari sensor berdasarkan nama
        const foundSensor = sensors.find(
            s => s.namaSensor.toLowerCase() === sensor.toLowerCase()
        );
        
        if (!foundSensor) {
            results.failed.push({
                sensor,
                reason: `Sensor "${sensor}" tidak ditemukan`
            });
            return;
        }
        
        // Update nilai dan waktu
        foundSensor.nilai = parseFloat(nilai);
        foundSensor.waktuUpdate = new Date().toISOString();
        
        results.success.push({
            sensor: foundSensor.namaSensor,
            nilai: foundSensor.nilai,
            satuan: foundSensor.satuan,
            waktuUpdate: foundSensor.waktuUpdate
        });
    });
    
    // Response dengan ringkasan
    res.json({
        success: true,
        message: `Berhasil update ${results.success.length} sensor, ${results.failed.length} gagal`,
        totalProcessed: sensorsToUpdate.length,
        totalSuccess: results.success.length,
        totalFailed: results.failed.length,
        data: {
            updated: results.success,
            failed: results.failed
        }
    });
});

module.exports = router;