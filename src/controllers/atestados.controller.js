const supabase = require('../config/supabase');

exports.listarAtestados = async (req, res) => {
    const { tenant_id, usuario_id } = req.query;

    if (!tenant_id)
        return res.status(400).json({ error: 'tenant_id é obrigatório.' });

    let query = supabase
        .from('atestados')
        .select('*')
        .eq('tenant_id', tenant_id);

    if (usuario_id) query = query.eq('usuario_id', usuario_id);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
};

exports.uploadAtestado = async (req, res) => {
    const { tenant_id, usuario_id, data_emissao, dias_afastamento, motivo_cid } = req.body;

    if (!req.file || !tenant_id || !usuario_id || !data_emissao || !dias_afastamento)
        return res.status(400).json({ error: 'Arquivo, tenant_id, usuario_id, data_emissao e dias_afastamento são obrigatórios.' });

    const nomeArquivo = `${Date.now()}_${req.file.originalname}`;

    const { error: uploadError } = await supabase.storage
        .from('atestados')
        .upload(nomeArquivo, req.file.buffer, { contentType: 'application/pdf' });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: urlData } = supabase.storage
        .from('atestados')
        .getPublicUrl(nomeArquivo);

    const { error: dbError } = await supabase.from('atestados').insert({
        tenant_id,
        usuario_id,
        data_emissao,
        dias_afastamento,
        motivo_cid: motivo_cid || null,
        url_arquivo: urlData.publicUrl,
        status: 'ativo'
    });

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.status(201).json({ message: 'Atestado enviado com sucesso!', url: urlData.publicUrl });
};

exports.deletarAtestado = async (req, res) => {
    const { id } = req.params;

    const { data: doc, error: fetchError } = await supabase
        .from('atestados')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !doc)
        return res.status(404).json({ error: 'Atestado não encontrado.' });

    const nomeArquivo = doc.url_arquivo.split('/').pop();

    await supabase.storage.from('atestados').remove([nomeArquivo]);

    const { error: dbError } = await supabase
        .from('atestados')
        .delete()
        .eq('id', id);

    if (dbError) return res.status(500).json({ error: dbError.message });

    return res.json({ message: 'Atestado deletado com sucesso.' });
};