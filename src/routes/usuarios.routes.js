const express = require('express');
const router = express.Router();

const {
  getUsuarios,
  registerUsuario
} = require('../controllers/usuarios_controller');

router.get('/', getUsuarios);
router.post('/register', registerUsuario);

module.exports = router;