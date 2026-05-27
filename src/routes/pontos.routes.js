const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { registrarPonto, listarPontos } = require('../controllers/pontos.controller');

router.post('/registrar', authMiddleware, registrarPonto);
router.get('/', authMiddleware, listarPontos);

module.exports = router;