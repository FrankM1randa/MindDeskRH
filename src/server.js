const express = require('express');
const usuariosRoutes = require('./routes/usuarios.routes');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = 3000;

app.use(express.json());

// usa as rotas
app.use('/usuarios', usuariosRoutes);
app.use('/auth', authRoutes);

// rota teste
app.get('/', (req, res) => {
    res.send('API rodando 🚀');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});