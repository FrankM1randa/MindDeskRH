const supabase = require('../config/supabase');

exports.listarAvisos = async (req, res) => {
    const gerente_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    if (!tenant_id) {
        return res.status(403).json({
            error: 'Tenant inválido.'
        });
    }

    try {
        const avisos = [];
        const hoje = new Date();

        // Busca funcionários do gerente logado
        const { data: usuarios, error: userError } = await supabase
            .from('usuarios')
            .select(`
                id,
                nome,
                cargo,
                gerente_id,
                tenant_id
            `)
            .eq('tenant_id', tenant_id)
            .eq('gerente_id', gerente_id);

        if (userError) {
            return res.status(500).json({
                error: userError.message
            });
        }

        const usuarioIds = usuarios?.map(u => u.id) || [];

        if (usuarioIds.length === 0) {
            return res.json([]);
        }

        // =========================
        // FÉRIAS PENDENTES
        // =========================

        const { data: ferias, error: feriasError } = await supabase
            .from('ferias')
            .select(`
                *,
                usuarios (
                    nome,
                    cargo
                )
            `)
            .eq('tenant_id', tenant_id)
            .eq('status_ferias', 'pendente')
            .in('usuario_id', usuarioIds)
            .order('data_ferias_prevista', {
                ascending: true
            });

        if (feriasError) {
            return res.status(500).json({
                error: feriasError.message
            });
        }

        ferias?.forEach(f => {

            if (!f.data_ferias_prevista) return;

            const dataPrevista = new Date(f.data_ferias_prevista);

            const mesesPendente = Math.floor(
                (hoje - dataPrevista) /
                (1000 * 60 * 60 * 24 * 30)
            );

            let mensagem = null;
            let prioridade = null;

            if (mesesPendente > 20) {

                mensagem =
                    `${f.usuarios?.nome} possui férias a vencer. Caso não marque nos próximos 30 dias, será realizada marcação de férias compulsórias.`;

                prioridade = 'critica';

            } else if (mesesPendente > 16) {

                mensagem =
                    `${f.usuarios?.nome} tem férias pendentes de agendamento com prazo curto. Favor agendar as férias.`;

                prioridade = 'alta';

            } else if (mesesPendente > 12) {

                mensagem =
                    `${f.usuarios?.nome} possui férias disponíveis para agendar.`;

                prioridade = 'media';
            }

            if (mensagem) {

                avisos.push({
                    tipo: 'férias',
                    prioridade,
                    usuario_id: f.usuario_id,
                    nome: f.usuarios?.nome || 'Funcionário',
                    cargo: f.usuarios?.cargo || '-',
                    mensagem,
                    meses_pendente: mesesPendente,
                    data_prevista: f.data_ferias_prevista,
                    dias_restantes: 0
                });
            }
        });

        // =========================
        // AFASTAMENTOS / ATESTADOS
        // =========================

        const { data: atestados, error: atestadoError } = await supabase
            .from('atestados')
            .select(`
                *,
                usuarios (
                    nome,
                    cargo
                )
            `)
            .eq('tenant_id', tenant_id)
            .in('usuario_id', usuarioIds);

        if (atestadoError) {
            return res.status(500).json({
                error: atestadoError.message
            });
        }

        atestados?.forEach(atestado => {

            if (!atestado.data_emissao) return;

            const dataEmissao = new Date(atestado.data_emissao);

            const dataFim = new Date(dataEmissao);

            dataFim.setDate(
                dataFim.getDate() +
                Number(atestado.dias_afastamento || 0)
            );

            // Apenas afastamentos ainda ativos
            if (dataFim >= hoje) {

                const diasRestantes = Math.ceil(
                    (dataFim - hoje) /
                    (1000 * 60 * 60 * 24)
                );

                avisos.push({
                    tipo: 'afastamento',
                    prioridade: 'alta',
                    usuario_id: atestado.usuario_id,
                    nome: atestado.usuarios?.nome || 'Funcionário',
                    cargo: atestado.usuarios?.cargo || '-',
                    mensagem:
                        `${atestado.usuarios?.nome} está afastado(a) por ${atestado.dias_afastamento} dia(s). Retorno previsto em ${diasRestantes} dia(s).`,
                    dias_restantes: diasRestantes,
                    data_fim: dataFim.toISOString().split('T')[0]
                });
            }
        });

        // =========================
        // ORDENAÇÃO
        // =========================

        const ordemPrioridade = {
            critica: 0,
            alta: 1,
            media: 2
        };

        avisos.sort((a, b) => {

            const prioridadeA =
                ordemPrioridade[a.prioridade] ?? 99;

            const prioridadeB =
                ordemPrioridade[b.prioridade] ?? 99;

            if (prioridadeA !== prioridadeB) {
                return prioridadeA - prioridadeB;
            }

            return (
                (b.meses_pendente || 0) -
                (a.meses_pendente || 0)
            );
        });

        return res.json(avisos);

    } catch (err) {

        return res.status(500).json({
            error: 'Erro interno.',
            detalhe: err.message
        });
    }
};

exports.listarAvisosFuncionario = async (req, res) => {

    const usuario_id = req.user.id;
    const tenant_id = req.user.tenant_id;

    try {

        const avisos = [];
        const hoje = new Date();

        // =========================
        // FÉRIAS
        // =========================

        const { data: ferias, error: feriasError } = await supabase
            .from('ferias')
            .select('*')
            .eq('usuario_id', usuario_id)
            .eq('tenant_id', tenant_id)
            .eq('status_ferias', 'pendente')
            .order('data_ferias_prevista', {
                ascending: true
            });

        if (feriasError) {

            return res.status(500).json({
                error: feriasError.message
            });
        }

        ferias?.forEach(f => {

            if (!f.data_ferias_prevista) return;

            const dataPrevista = new Date(f.data_ferias_prevista);

            const mesesPendente = Math.floor(
                (hoje - dataPrevista) /
                (1000 * 60 * 60 * 24 * 30)
            );

            let mensagem = null;
            let prioridade = null;

            if (mesesPendente > 20) {

                mensagem =
                    'Você possui férias a vencer. Caso não marque nos próximos 30 dias, será realizada marcação de férias compulsórias.';

                prioridade = 'critica';

            } else if (mesesPendente > 16) {

                mensagem =
                    'Você tem férias pendentes de agendamento com prazo curto. Favor agendar suas férias.';

                prioridade = 'alta';

            } else if (mesesPendente > 12) {

                mensagem =
                    'Você possui férias disponíveis para agendar.';

                prioridade = 'media';
            }

            if (mensagem) {

                avisos.push({
                    tipo: 'férias',
                    prioridade,
                    mensagem,
                    meses_pendente: mesesPendente,
                    data_prevista: f.data_ferias_prevista,
                    dias_restantes: 0
                });
            }
        });

        // =========================
        // AFASTAMENTOS
        // =========================

        const { data: atestados, error: atestadoError } = await supabase
            .from('atestados')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('usuario_id', usuario_id);

        if (atestadoError) {

            return res.status(500).json({
                error: atestadoError.message
            });
        }

        atestados?.forEach(atestado => {

            if (!atestado.data_emissao) return;

            const dataEmissao = new Date(atestado.data_emissao);

            const dataFim = new Date(dataEmissao);

            dataFim.setDate(
                dataFim.getDate() +
                Number(atestado.dias_afastamento || 0)
            );

            if (dataFim >= hoje) {

                const diasRestantes = Math.ceil(
                    (dataFim - hoje) /
                    (1000 * 60 * 60 * 24)
                );

                avisos.push({
                    tipo: 'afastamento',
                    prioridade: 'alta',
                    mensagem:
                        `Você está afastado(a). Retorno previsto em ${diasRestantes} dia(s).`,
                    dias_restantes: diasRestantes,
                    data_fim: dataFim.toISOString().split('T')[0]
                });
            }
        });

        // =========================
        // ORDENAÇÃO
        // =========================

        const ordemPrioridade = {
            critica: 0,
            alta: 1,
            media: 2
        };

        avisos.sort((a, b) => {

            const prioridadeA =
                ordemPrioridade[a.prioridade] ?? 99;

            const prioridadeB =
                ordemPrioridade[b.prioridade] ?? 99;

            if (prioridadeA !== prioridadeB) {
                return prioridadeA - prioridadeB;
            }

            return (
                (b.meses_pendente || 0) -
                (a.meses_pendente || 0)
            );
        });

        return res.json(avisos);

    } catch (err) {

        return res.status(500).json({
            error: 'Erro interno.',
            detalhe: err.message
        });
    }
};