/**
 * ============================================
 * CHAT ROUTES
 * ============================================
 */

const express = require('express');
const router = express.Router();
const { getAIResponse } = require('../controllers/ai-controller');

/**
 * POST /api/chat
 * Send message to AI
 */
router.post('/chat', async (req, res) => {
    try {
        const { message, history, model } = req.body;

        // Validate input
        if (!message || typeof message !== 'string') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'Message is required and must be a string'
            });
        }

        // Get AI response
        const response = await getAIResponse(
            message,
            model || 'gpt-oss-20b',
            history || []
        );

        res.json(response);

    } catch (error) {
        console.error('❌ Chat endpoint error:', error);
        res.status(500).json({
            error: 'Failed to process request',
            message: error.message
        });
    }
});

module.exports = router;
