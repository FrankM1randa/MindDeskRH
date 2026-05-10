const express = require('express');
const router = express.Router();
const aiService = require('../services/ai_service');

router.post('/perguntar', async (req, res) => {
    // O front-end antigo só manda query e tenant_id
    const { query, tenant_id } = req.body;

    if (!query) {
        return res.status(400).json({ erro: "A pergunta é obrigatória." });
    }

    try {
        // Passamos os dados da tela + dados mockados para o teste rodar
        const resultado = await aiService.askAI({ 
            query, 
            tenant_id,
            user_id: "teste-123",        // Simula o ID do Supabase
            role: "gerente",             // Simula que é gerente (para não ser bloqueado)
            current_agent: "main"        // Diz que está no menu principal
        });
        
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

module.exports = router;