const express = require('express');
const usuariosRoutes = require('./routes/usuarios.routes');

const app = express();
const PORT = 3000;

app.use(express.json());

// usa as rotas
app.use('/usuarios', usuariosRoutes);

// rota teste
app.get('/', (req, res) => {
    res.send('API rodando 🚀');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});