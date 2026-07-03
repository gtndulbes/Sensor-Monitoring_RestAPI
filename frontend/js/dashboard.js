/**
 * ============================================
 * DASHBOARD MONITORING SENSOR
 * ============================================
 * 
 * Fitur:
 * - Fetch data sensor dari REST API
 * - Update DOM secara real-time tanpa refresh
 * - Animasi halus saat nilai berubah
 * - Deteksi status server (online/offline)
 * - Error handling
 * - Polling setiap 3 detik
 */

// ============================================
// KONFIGURASI
// ============================================

const CONFIG = {
    // URL backend (sesuaikan dengan port server Anda)
    API_BASE_URL: 'http://localhost:3000',
    
    // API Key (harus sama dengan di file .env)
    API_KEY: 'sensor_monitoring_2024_secure_key',
    
    // Interval polling (dalam milidetik)
    POLLING_INTERVAL: 3000, // 3 detik
    
    // Timeout fetch (dalam milidetik)
    FETCH_TIMEOUT: 5000 // 5 detik
};

// ============================================
// STATE MANAGEMENT
// ============================================

// Menyimpan data sensor sebelumnya untuk perbandingan
let previousData = {
    suhu: null,
    kelembapan: null,
    tekanan: null
};

// Status server
let isServerOnline = false;

// ID interval untuk polling
let pollingInterval = null;

// Flag untuk mencegah multiple simultaneous requests
let isFetching = false;

// ============================================
// DOM REFERENCES
// ============================================

const DOM = {
    // Status Server
    serverStatus: document.getElementById('serverStatus'),
    statusDot: document.querySelector('.status-dot'),
    statusText: document.querySelector('.status-text'),
    
    // Last Update
    lastUpdateTime: document.querySelector('#lastUpdate span'),
    
    // Loading Overlay
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Nilai Sensor
    valueSuhu: document.getElementById('valueSuhu'),
    valueKelembapan: document.getElementById('valueKelembapan'),
    valueTekanan: document.getElementById('valueTekanan'),
    
    // Waktu Update
    timeSuhu: document.getElementById('timeSuhu'),
    timeKelembapan: document.getElementById('timeKelembapan'),
    timeTekanan: document.getElementById('timeTekanan'),
    
    // Badge Status
    badgeSuhu: document.querySelector('[data-sensor="suhu"] .badge'),
    badgeKelembapan: document.querySelector('[data-sensor="kelembapan"] .badge'),
    badgeTekanan: document.querySelector('[data-sensor="tekanan"] .badge'),
    
    // Progress Bar
    progressSuhu: document.querySelector('[data-sensor="suhu"] .progress-fill'),
    progressKelembapan: document.querySelector('[data-sensor="kelembapan"] .progress-fill'),
    progressTekanan: document.querySelector('[data-sensor="tekanan"] .progress-fill'),
    
    // Card (untuk efek highlight)
    cardSuhu: document.querySelector('[data-sensor="suhu"]'),
    cardKelembapan: document.querySelector('[data-sensor="kelembapan"]'),
    cardTekanan: document.querySelector('[data-sensor="tekanan"]')
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format timestamp ke format yang mudah dibaca
 * @param {string} isoString - Waktu dalam format ISO
 * @returns {string} Waktu yang sudah diformat
 */
function formatTime(isoString) {
    if (!isoString) return '--';
    
    const date = new Date(isoString);
    
    // Opsi format: HH:MM:SS DD/MM/YYYY
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
}

/**
 * Format waktu relatif (contoh: "2 menit yang lalu")
 * @param {string} isoString - Waktu dalam format ISO
 * @returns {string} Waktu relatif
 */
function formatRelativeTime(isoString) {
    if (!isoString) return '--';
    
    const now = new Date();
    const date = new Date(isoString);
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 5) return 'Baru saja';
    if (diffSeconds < 60) return `${diffSeconds} detik lalu`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    
    return formatTime(isoString);
}

/**
 * Menentukan status sensor berdasarkan nilai
 * @param {string} sensorName - Nama sensor
 * @param {number} nilai - Nilai sensor
 * @returns {object} { status: 'normal'|'warning'|'danger', text: string }
 */
function getSensorStatus(sensorName, nilai) {
    switch (sensorName.toLowerCase()) {
        case 'suhu':
            if (nilai > 35) return { status: 'danger', text: 'Tinggi' };
            if (nilai > 30) return { status: 'warning', text: 'Hangat' };
            return { status: 'normal', text: 'Normal' };
            
        case 'kelembapan':
            if (nilai > 90) return { status: 'danger', text: 'Sangat Lembab' };
            if (nilai > 80) return { status: 'warning', text: 'Lembab' };
            if (nilai < 30) return { status: 'danger', text: 'Kering' };
            if (nilai < 40) return { status: 'warning', text: 'Agak Kering' };
            return { status: 'normal', text: 'Normal' };
            
        case 'tekanan':
            if (nilai > 1050) return { status: 'danger', text: 'Tinggi' };
            if (nilai > 1020) return { status: 'warning', text: 'Agak Tinggi' };
            if (nilai < 980) return { status: 'danger', text: 'Rendah' };
            if (nilai < 1000) return { status: 'warning', text: 'Agak Rendah' };
            return { status: 'normal', text: 'Normal' };
            
        default:
            return { status: 'normal', text: 'Normal' };
    }
}

/**
 * Menghitung persentase progress bar
 * @param {string} sensorName - Nama sensor
 * @param {number} nilai - Nilai sensor
 * @returns {number} Persentase (0-100)
 */
function calculateProgress(sensorName, nilai) {
    switch (sensorName.toLowerCase()) {
        case 'suhu':
            // Range: 20-35°C
            return Math.min(100, Math.max(0, ((nilai - 20) / 15) * 100));
            
        case 'kelembapan':
            // Range: 30-90%
            return Math.min(100, Math.max(0, ((nilai - 30) / 60) * 100));
            
        case 'tekanan':
            // Range: 980-1050 hPa
            return Math.min(100, Math.max(0, ((nilai - 980) / 70) * 100));
            
        default:
            return 50;
    }
}

/**
 * Fetch dengan timeout
 * @param {string} url - URL endpoint
 * @param {object} options - Fetch options
 * @param {number} timeout - Timeout dalam ms
 * @returns {Promise} Response
 */
async function fetchWithTimeout(url, options = {}, timeout = CONFIG.FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch data sensor dari backend
 * @returns {Promise<Array>} Array data sensor
 */
async function fetchSensorData() {
    try {
        const response = await fetchWithTimeout(
            `${CONFIG.API_BASE_URL}/api/sensors`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': CONFIG.API_KEY
                }
            }
        );
        
        // Handle response
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Gagal mengambil data');
        }
        
        return result.data;
        
    } catch (error) {
        // Bedakan jenis error
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - Server tidak merespons');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Tidak dapat terhubung ke server');
        }
        throw error;
    }
}

// ============================================
// DOM UPDATE FUNCTIONS
// ============================================

/**
 * Update tampilan status server
 * @param {boolean} online - Status server
 */
function updateServerStatus(online) {
    if (online === isServerOnline) return; // Tidak ada perubahan
    
    isServerOnline = online;
    
    if (online) {
        DOM.statusDot.classList.remove('offline');
        DOM.statusDot.classList.add('online');
        DOM.statusText.textContent = 'Server Online';
        DOM.statusText.style.color = 'var(--color-success)';
    } else {
        DOM.statusDot.classList.remove('online');
        DOM.statusDot.classList.add('offline');
        DOM.statusText.textContent = 'Server Offline';
        DOM.statusText.style.color = 'var(--color-danger)';
    }
}

/**
 * Animasi highlight pada card
 * @param {HTMLElement} card - Elemen card
 */
function highlightCard(card) {
    card.style.transition = 'none';
    card.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.3)';
    card.style.borderColor = 'var(--accent-blue-light)';
    
    setTimeout(() => {
        card.style.transition = 'all 0.5s ease';
        card.style.boxShadow = '';
        card.style.borderColor = '';
    }, 100);
}

/**
 * Animasi nilai berubah
 * @param {HTMLElement} element - Elemen nilai
 */
function animateValue(element) {
    element.classList.remove('value-updated');
    void element.offsetWidth; // Trigger reflow
    element.classList.add('value-updated');
}

/**
 * Update satu card sensor
 * @param {object} sensorData - Data sensor
 */
function updateSensorCard(sensorData) {
    const { namaSensor, nilai, satuan, waktuUpdate } = sensorData;
    const sensorKey = namaSensor.toLowerCase();
    
    // Tentukan elemen berdasarkan sensor
    let valueElement, timeElement, badgeElement, progressElement, cardElement;
    
    switch (sensorKey) {
        case 'suhu':
            valueElement = DOM.valueSuhu;
            timeElement = DOM.timeSuhu;
            badgeElement = DOM.badgeSuhu;
            progressElement = DOM.progressSuhu;
            cardElement = DOM.cardSuhu;
            break;
            
        case 'kelembapan':
            valueElement = DOM.valueKelembapan;
            timeElement = DOM.timeKelembapan;
            badgeElement = DOM.badgeKelembapan;
            progressElement = DOM.progressKelembapan;
            cardElement = DOM.cardKelembapan;
            break;
            
        case 'tekanan':
            valueElement = DOM.valueTekanan;
            timeElement = DOM.timeTekanan;
            badgeElement = DOM.badgeTekanan;
            progressElement = DOM.progressTekanan;
            cardElement = DOM.cardTekanan;
            break;
            
        default:
            console.warn(`Sensor tidak dikenal: ${namaSensor}`);
            return;
    }
    
    // Cek apakah nilai berubah
    const nilaiBerubah = previousData[sensorKey] !== nilai;
    
    // Update nilai dengan animasi jika berubah
    if (nilaiBerubah) {
        valueElement.textContent = nilai;
        animateValue(valueElement);
        highlightCard(cardElement);
        previousData[sensorKey] = nilai;
    }
    
    // Update waktu
    timeElement.textContent = formatRelativeTime(waktuUpdate);
    timeElement.title = formatTime(waktuUpdate); // Tooltip dengan waktu lengkap
    
    // Update badge status
    const status = getSensorStatus(namaSensor, nilai);
    badgeElement.textContent = status.text;
    badgeElement.className = 'badge'; // Reset class
    
    switch (status.status) {
        case 'normal':
            badgeElement.classList.add('badge-normal');
            break;
        case 'warning':
            badgeElement.classList.add('badge-warning');
            break;
        case 'danger':
            badgeElement.classList.add('badge-danger');
            break;
    }
    
    // Update progress bar
    const progress = calculateProgress(namaSensor, nilai);
    progressElement.style.width = `${progress}%`;
}

/**
 * Update waktu "Last Update" di header
 */
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = formatTime(now.toISOString());
    DOM.lastUpdateTime.textContent = timeString;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Fetch dan update semua data sensor
 */
async function fetchAndUpdate() {
    // Cegah multiple simultaneous requests
    if (isFetching) {
        console.log('⏳ Request sedang berjalan, melewati...');
        return;
    }
    
    isFetching = true;
    
    try {
        const sensors = await fetchSensorData();
        
        // Server online
        updateServerStatus(true);
        
        // Update setiap sensor
        sensors.forEach(sensor => {
            updateSensorCard(sensor);
        });
        
        // Update waktu
        updateLastUpdateTime();
        
        console.log('✅ Data berhasil diperbarui');
        
    } catch (error) {
        console.error('❌ Gagal fetch data:', error.message);
        
        // Server offline
        updateServerStatus(false);
        
        // Tampilkan pesan error di console
        if (error.message.includes('401')) {
            console.error('🔑 API Key tidak valid');
        } else if (error.message.includes('403')) {
            console.error('🚫 API Key salah');
        } else if (error.message.includes('timeout')) {
            console.error('⏰ Request timeout');
        } else if (error.message.includes('terhubung')) {
            console.error('🔌 Server tidak dapat dijangkau');
        }
        
    } finally {
        isFetching = false;
    }
}

/**
 * Mulai polling data sensor
 */
function startPolling() {
    console.log(`🔄 Memulai polling setiap ${CONFIG.POLLING_INTERVAL / 1000} detik`);
    
    // Fetch pertama kali
    fetchAndUpdate();
    
    // Set interval untuk polling
    pollingInterval = setInterval(fetchAndUpdate, CONFIG.POLLING_INTERVAL);
}

/**
 * Hentikan polling
 */
function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('⏹️ Polling dihentikan');
    }
}

/**
 * Sembunyikan loading overlay
 */
function hideLoading() {
    DOM.loadingOverlay.classList.add('hidden');
    
    // Hapus overlay setelah animasi selesai
    setTimeout(() => {
        DOM.loadingOverlay.style.display = 'none';
    }, 500);
}

// ============================================
// ERROR HANDLING GLOBAL
// ============================================

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Unhandled Promise Rejection:', event.reason);
    updateServerStatus(false);
});

// ============================================
// INITIALIZATION
// ============================================

/**
 * Inisialisasi dashboard
 */
function initDashboard() {
    console.log('🚀 Dashboard Monitoring Sensor');
    console.log(`📡 Backend: ${CONFIG.API_BASE_URL}`);
    console.log(`🔄 Polling: setiap ${CONFIG.POLLING_INTERVAL / 1000} detik`);
    console.log('=================================');
    
    // Mulai polling
    startPolling();
    
    // Sembunyikan loading setelah 1 detik
    // (memberi waktu untuk fetch pertama)
    setTimeout(hideLoading, 1000);
}

// ============================================
// CLEANUP
// ============================================

// Hentikan polling saat halaman ditutup
window.addEventListener('beforeunload', () => {
    stopPolling();
});

// ============================================
// START
// ============================================

// Jalankan dashboard saat DOM siap
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDashboard);
} else {
    // DOM sudah siap
    initDashboard();
}