const express = require('express');
const usuariosRoutes = require('./routes/usuarios.routes');

//Leo
const cors = require('cors');
const chatRoutes = require('./routes/chat.routes'); 
//Leo

const app = express();
const PORT = 3000;

//Leo
app.use(cors());
//Leo

app.use(express.json());

// usa as rotas
app.use('/usuarios', usuariosRoutes);

//Leo
app.use('/chat', chatRoutes); 
//Leo

// rota teste
app.get('/', (req, res) => {
    res.send('API rodando 🚀');
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});