const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const { listarCursos, listarTodosCursos, enviarCurso, deletarCurso } = require('../controllers/cursos.controller');
const cursosController = require('../controllers/cursos.controller');

// Funcionário vê seus cursos
router.get('/', authMiddleware, listarCursos);

// Somente admin
router.get('/todos', authMiddleware, adminMiddleware, listarTodosCursos);
router.post('/', authMiddleware, adminMiddleware, enviarCurso);
router.delete('/:id', authMiddleware, adminMiddleware, deletarCurso);
router.patch('/:id/concluir', authMiddleware, cursosController.concluirCurso);
module.exports = router;