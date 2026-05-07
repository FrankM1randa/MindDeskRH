const express = require('express');
const router = express.Router();
const aiService = require('../services/ai_service');

router.post('/perguntar', async (req, res) => {
    const { query, tenant_id } = req.body;

    if (!query) {
        return res.status(400).json({ erro: "A pergunta é obrigatória." });
    }

    try {
        const resultado = await aiService.askAI({ query, tenant_id });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;