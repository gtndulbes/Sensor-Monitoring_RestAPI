// middleware/apiKeyAuth.js

/**
 * Middleware untuk memvalidasi API Key
 * 
 * Cara kerja:
 * 1. Mengambil API Key dari header 'x-api-key'
 * 2. Membandingkan dengan API Key di .env
 * 3. Jika tidak ada → 401 Unauthorized
 * 4. Jika salah → 403 Forbidden
 * 5. Jika benar → lanjut ke endpoint
 */

const apiKeyAuth = (req, res, next) => {
    // Ambil API Key dari header request
    const clientApiKey = req.headers['x-api-key'];
    
    // Ambil API Key dari environment variable
    const serverApiKey = process.env.API_KEY;
    
    // Cek apakah API Key dikirim
    if (!clientApiKey) {
        return res.status(401).json({
            success: false,
            message: 'API Key tidak ditemukan. Kirim API Key di header x-api-key'
        });
    }
    
    // Cek apakah API Key sesuai
    if (clientApiKey !== serverApiKey) {
        return res.status(403).json({
            success: false,
            message: 'API Key tidak valid. Akses ditolak.'
        });
    }
    
    // API Key valid, lanjut ke endpoint
    next();
};

module.exports = apiKeyAuth;