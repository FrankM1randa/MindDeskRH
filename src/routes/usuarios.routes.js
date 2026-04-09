const express = require('express');
const router = express.Router();

const {
  getUsuarios,
  registerUsuario,
  getUsuarioByEmail,
  updateUsuario,
  deleteUsuario
} = require('../controllers/usuarios_controller');

router.get('/', getUsuarios);
router.get('/busca', getUsuarioByEmail);
router.post('/register', registerUsuario);
router.put('/', updateUsuario);
router.delete('/', deleteUsuario);
module.exports = router;