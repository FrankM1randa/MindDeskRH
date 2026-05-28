const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { listarAvisos } = require('../controllers/avisos.controller');

router.get('/', authMiddleware, adminMiddleware, listarAvisos);

module.exports = router;