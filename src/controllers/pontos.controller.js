const supabase = require('../config/supabase');

// Registra ponto ao escanear o QR Code
exports.registrarPonto = async (req, res) => {
    const { usuario_id } = req.body;

    if (!usuario_id) {
        return res.status(400).json({ error: 'usuario_id é obrigatório.' });
    }

    try {
        // 1. Busca o tenant_id do usuário
        const { data: usuario, error: userError } = await supabase
            .from('usuarios')
            .select('tenant_id')
            .eq('id', usuario_id)
            .single();

        if (userError || !usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        // 2. Busca o último ponto do usuário hoje
        const hoje = new Date().toISOString().split('T')[0];

        const { data: pontos } = await supabase
            .from('pontos')
            .select('tipo')
            .eq('usuario_id', usuario_id)
            .gte('horario', `${hoje}T00:00:00`)
            .lte('horario', `${hoje}T23:59:59`)
            .order('horario', { ascending: false })
            .limit(1);

        // 3. Define o próximo tipo automaticamente
        const sequencia = ['entrada', 'almoco', 'retorno_almoco', 'saida'];
        const ultimoTipo = pontos?.[0]?.tipo;
        const proximoIndex = ultimoTipo ? sequencia.indexOf(ultimoTipo) + 1 : 0;

        if (proximoIndex >= sequencia.length) {
            return res.status(400).json({ error: 'Ponto do dia já encerrado.' });
        }

        const tipo = sequencia[proximoIndex];

        // 4. Registra o ponto
        const { data, error } = await supabase
            .from('pontos')
            .insert({
                usuario_id,
                tenant_id: usuario.tenant_id,
                horario: new Date().toISOString(),
                tipo
            })
            .select();

        if (error) return res.status(500).json({ error: error.message });

        return res.status(201).json({ message: `Ponto registrado: ${tipo}`, ponto: data[0] });

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
    }
};

// Lista pontos por usuário
exports.listarPontos = async (req, res) => {
    const { usuario_id } = req.query;

    if (!usuario_id) {
        return res.status(400).json({ error: 'usuario_id é obrigatório.' });
    }

    const { data, error } = await supabase
        .from('pontos')
        .select('*')
        .eq('usuario_id', usuario_id)
        .order('horario', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
};