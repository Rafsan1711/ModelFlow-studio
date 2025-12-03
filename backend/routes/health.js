/**
 * ============================================
 * HEALTH CHECK ROUTE
 * ============================================
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'NexusAI Backend is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

module.exports = router;
