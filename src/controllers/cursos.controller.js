const supabase = require('../config/supabase');

exports.listarCursos = async (req, res) => {
    try {
        const usuario_id = String(req.user.id).trim();

        const { data, error } = await supabase
            .from('cursos')
            .select('*, usuarios!cursos_usuario_id_fkey (nome, email, cargo)')
            .eq('usuario_id', usuario_id)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.' });
    }
};

exports.listarTodosCursos = async (req, res) => {
    try {
        const tenant_id = Number(req.user.tenant_id);

        const { data, error } = await supabase
            .from('cursos')
            .select(`*, usuarios!cursos_usuario_id_fkey (nome, email, cargo)`)
            .eq('tenant_id', tenant_id)
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data);
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.' });
    }
};

// =========================================
// Gerente envia curso (Catálogo ou Atribuição)
// =========================================
exports.enviarCurso = async (req, res) => {
    try {
        const { usuarios_ids, titulo, link, descricao,status, prazo } = req.body;
        const tenant_id = Number(req.user.tenant_id);
        const criado_por = String(req.user.id).trim();

        if (!titulo || !link) {
            return res.status(400).json({ error: 'Título e link são obrigatórios.' });
        }

        let cursosParaInserir = [];

        // SE NÃO SELECIONOU NINGUÉM -> Salva apenas no catálogo (usuario_id = null)
        if (!usuarios_ids || usuarios_ids.length === 0) {
            cursosParaInserir.push({
                tenant_id,
                usuario_id: null,
                titulo,
                link,
                descricao: descricao || null,
                criado_por,
                status: 'pendente',
                prazo
            });
        } 
        // SE SELECIONOU FUNCIONÁRIOS -> Insere uma linha para cada
        else {
            cursosParaInserir = usuarios_ids.map(id => ({
                tenant_id,
                usuario_id: String(id).trim(),
                titulo,
                link,
                descricao: descricao || null,
                criado_por
            }));
        }

        const { data, error } = await supabase
            .from('cursos')
            .insert(cursosParaInserir)
            .select();

        if (error) return res.status(500).json({ error: error.message });

        return res.status(201).json({ message: `Ação realizada com sucesso!`, cursos: data });
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.' });
    }
};

// =========================================
// Deletar curso (Remove o curso e todos os acessos)
// =========================================
exports.deletarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = Number(req.user.tenant_id);

        // 1. Busca qual é o link do curso que está sendo deletado
        const { data: curso } = await supabase
            .from('cursos')
            .select('link')
            .eq('id', id)
            .single();

        if (!curso) return res.status(404).json({ error: 'Curso não encontrado.' });

        // 2. Deleta TODOS os registros do tenant que tenham o mesmo link
        const { error } = await supabase
            .from('cursos')
            .delete()
            .eq('link', curso.link)
            .eq('tenant_id', tenant_id);

        if (error) return res.status(500).json({ error: error.message });

        return res.json({ message: 'Curso e todas as atribuições removidos com sucesso.' });
    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.' });
    }
};