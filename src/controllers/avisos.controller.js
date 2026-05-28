const supabase = require('../config/supabase');

exports.listarAvisos = async (req, res) => {
    const { tenant_id } = req.query;

    if (!tenant_id)
        return res.status(400).json({ error: 'tenant_id é obrigatório.' });

    try {
        const avisos = [];
        const hoje = new Date();

        // Busca todos os funcionários do tenant
        const { data: usuarios, error: userError } = await supabase
            .from('usuarios')
            .select('id, nome, cargo, data_contratacao')
            .eq('tenant_id', tenant_id);

        if (userError) return res.status(500).json({ error: userError.message });

        // 1. Verifica férias vencendo (a cada 2 anos da data de contratação)
        usuarios.forEach(usuario => {
            if (!usuario.data_contratacao) return;

            const contratacao = new Date(usuario.data_contratacao);
            const anosContratado = Math.floor(
                (hoje - contratacao) / (1000 * 60 * 60 * 24 * 365)
            );

            // Calcula próximo vencimento de férias
            const proximoVencimento = new Date(contratacao);
            proximoVencimento.setFullYear(contratacao.getFullYear() + anosContratado + 1);

            const diasParaVencer = Math.floor(
                (proximoVencimento - hoje) / (1000 * 60 * 60 * 24)
            );

            if (diasParaVencer <= 90 && diasParaVencer >= 0) {
                avisos.push({
                    tipo: 'ferias',
                    prioridade: diasParaVencer <= 30 ? 'alta' : 'media',
                    usuario_id: usuario.id,
                    nome: usuario.nome,
                    cargo: usuario.cargo,
                    mensagem: `Férias de ${usuario.nome} vencem em ${diasParaVencer} dia(s).`,
                    dias_restantes: diasParaVencer,
                    data_vencimento: proximoVencimento.toISOString().split('T')[0]
                });
            }
        });

        // 2. Verifica afastamentos ativos
        const { data: atestados, error: atestadoError } = await supabase
            .from('atestados')
            .select('*, usuarios(nome, cargo)')
            .eq('tenant_id', tenant_id)
            .eq('status', 'ativo');

        if (atestadoError) return res.status(500).json({ error: atestadoError.message });

        atestados?.forEach(atestado => {
            const dataEmissao = new Date(atestado.data_emissao);
            const dataFim = new Date(dataEmissao);
            dataFim.setDate(dataFim.getDate() + atestado.dias_afastamento);

            if (dataFim >= hoje) {
                const diasRestantes = Math.floor(
                    (dataFim - hoje) / (1000 * 60 * 60 * 24)
                );

                avisos.push({
                    tipo: 'afastamento',
                    prioridade: 'alta',
                    usuario_id: atestado.usuario_id,
                    nome: atestado.usuarios?.nome,
                    cargo: atestado.usuarios?.cargo,
                    mensagem: `${atestado.usuarios?.nome} está afastado(a) por ${atestado.dias_afastamento} dia(s). Retorno previsto em ${diasRestantes} dia(s).`,
                    dias_restantes: diasRestantes,
                    data_fim: dataFim.toISOString().split('T')[0]
                });
            }
        });

        // Ordena por prioridade (alta primeiro) e dias restantes
        avisos.sort((a, b) => {
            if (a.prioridade === 'alta' && b.prioridade !== 'alta') return -1;
            if (a.prioridade !== 'alta' && b.prioridade === 'alta') return 1;
            return a.dias_restantes - b.dias_restantes;
        });

        return res.json(avisos);

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
    }
};