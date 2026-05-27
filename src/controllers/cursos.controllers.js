const supabase = require('../config/supabase');

// Listar cursos do funcionário logado
exports.listarCursos = async (req, res) => {
    const { usuario_id } = req.query;

    if (!usuario_id)
        return res.status(400).json({ error: 'usuario_id é obrigatório.' });

    const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .eq('usuario_id', usuario_id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
};

// Listar todos os cursos do tenant (visão do gerente)
exports.listarTodosCursos = async (req, res) => {
    const { tenant_id } = req.query;

    if (!tenant_id)
        return res.status(400).json({ error: 'tenant_id é obrigatório.' });

    const { data, error } = await supabase
        .from('cursos')
        .select(`*, usuarios (nome, email, cargo)`)
        .eq('tenant_id', tenant_id)
        .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
};

// Gerente envia curso para funcionário
exports.enviarCurso = async (req, res) => {
    const { tenant_id, usuario_id, titulo, link, descricao } = req.body;

    if (!tenant_id || !usuario_id || !titulo || !link)
        return res.status(400).json({ error: 'tenant_id, usuario_id, titulo e link são obrigatórios.' });

    const criado_por = req.user.id;

    const { data, error } = await supabase
        .from('cursos')
        .insert({ tenant_id, usuario_id, titulo, link, descricao: descricao || null, criado_por })
        .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ message: 'Curso enviado com sucesso!', curso: data[0] });
};

// Deletar curso
exports.deletarCurso = async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ message: 'Curso removido com sucesso.' });
};