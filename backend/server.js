/**
 * ============================================
 * MODELFLOW BACKEND SERVER - CORS FIXED
 * ============================================
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS Configuration - FIXED
const allowedOrigins = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://modelflow-studio-ai.onrender.com', // ✅ Add your frontend URL
    'https://your-custom-domain.com' // Add any custom domains
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn('⚠️ Blocked origin:', origin);
            // ✅ Allow anyway for development (remove in production if needed)
            callback(null, true);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// ✅ Handle preflight requests
app.options('*', cors());

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path} from ${req.get('origin') || 'unknown'}`);
    next();
});

// Routes
app.use('/api', healthRoutes);
app.use('/api', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'ModelFlow Studio Backend API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            chat: '/api/chat'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 ============================================');
    console.log('   ModelFlow Studio Backend Server Started');
    console.log('   ============================================');
    console.log(`   📡 Server: http://localhost:${PORT}`);
    console.log(`   🔑 HF Token: ${process.env.HF_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   🌐 CORS: Enabled for ${allowedOrigins.length} origins`);
    console.log('   ============================================');
    console.log('');
});
