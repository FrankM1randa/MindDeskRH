const supabase = require('../config/supabase');

// GET
exports.getUsuarios = async (req, res) => {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*');

    if (error) return res.status(500).json(error);

    res.json(data);
};

// REGISTER
exports.registerUsuario = async (req, res) => {
    const { nome, email, password } = req.body;

    if (!nome || !email || !password) {
        return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }

    try {
        // 1. Cria usuário no auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password
        });

        if (authError) {
            return res.status(400).json({
                erro: 'Erro ao criar usuário',
                detalhe: authError.message
            });
        }

        if (!authData?.user) {
            return res.status(400).json({ erro: 'Usuário não retornado pelo auth' });
        }

        // Verifica se email já existe
        if (authData.user.identities?.length === 0) {
            return res.status(400).json({ erro: 'E-mail já cadastrado' });
        }

        const userId = authData.user.id;

        // 2. Aguarda o trigger executar
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3. Atualiza o nome na tabela usuarios
        const { data, error } = await supabase
            .from('usuarios')
            .update({ nome })
            .eq('id', userId)
            .select();

        if (error) {
            return res.status(500).json(error);
        }

        res.json(data);

    } catch (err) {
        res.status(500).json({
            erro: 'Erro interno',
            detalhe: err.message
        });
    }
};

exports.getUsuarioByEmail = async (req, res) => {
    const { email } = req.query;

    if (!email) return res.status(400).json({ erro: 'Email é obrigatório' });

    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

    if (error) return res.status(500).json(error);

    if (!data) return res.status(404).json({ erro: 'Usuário não encontrado' });

    res.json(data);
};

exports.updateUsuario = async (req, res) => {
    const { email } = req.query;
    const { nome, novoEmail } = req.body;

    if (!email) {
        return res.status(400).json({ erro: 'Informe o email do usuário na query' });
    }

    if (!nome && !novoEmail) {
        return res.status(400).json({ erro: 'Informe ao menos um campo para atualizar' });
    }

    const campos = {};
    if (nome) campos.nome = nome;
    if (novoEmail) campos.email = novoEmail;

    const { data, error } = await supabase
        .from('usuarios')
        .update(campos)
        .eq('email', email)
        .select();

    if (error) return res.status(500).json(error);

    if (!data || data.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json(data);
};

exports.deleteUsuario = async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ erro: 'Informe o email do usuário na query' });
    }

    const { data, error } = await supabase
        .from('usuarios')
        .delete()
        .eq('email', email)
        .select();

    if (error) return res.status(500).json(error);

    if (!data || data.length === 0) {
        return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    res.json({ mensagem: 'Usuário deletado com sucesso', usuario: data });
};