const supabase = require('../config/supabase');

// =========================================
// RELATÓRIO DE FALTAS
// =========================================
exports.relatorioFaltas = async (req, res) => {

    const { tenant_id, data_inicio, data_fim } = req.query;

    if (!tenant_id || !data_inicio || !data_fim) {

        return res.status(400).json({
            error: 'tenant_id, data_inicio e data_fim são obrigatórios.'
        });
    }

    try {

        const gerente_id = req.user.id;

        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select('id, nome, email, cargo')
            .eq('tenant_id', tenant_id)
            .eq('gerente_id', gerente_id);

        if (usuariosError) {

            return res.status(500).json({
                error: usuariosError.message
            });
        }

        const usuariosIds =
            usuarios.map(u => u.id);

        const { data: pontos, error: pontosError } = await supabase
            .from('pontos')
            .select('usuario_id, horario, tipo')
            .eq('tenant_id', tenant_id)
            .in('usuario_id', usuariosIds)
            .gte('horario', `${data_inicio}T00:00:00`)
            .lte('horario', `${data_fim}T23:59:59`);

        if (pontosError) {

            return res.status(500).json({
                error: pontosError.message
            });
        }

        const diasUteis = [];

        const atual = new Date(data_inicio);
        const fim = new Date(data_fim);

        while (atual <= fim) {

            const diaSemana = atual.getDay();

            if (diaSemana !== 0 && diaSemana !== 6) {

                diasUteis.push(
                    atual.toISOString().split('T')[0]
                );
            }

            atual.setDate(atual.getDate() + 1);
        }

        const relatorio = usuarios
            .map(usuario => {

                const faltas = diasUteis.filter(dia => {

                    const temEntrada = pontos?.some(
                        p =>
                            p.usuario_id === usuario.id &&
                            p.tipo === 'entrada' &&
                            p.horario.startsWith(dia)
                    );

                    return !temEntrada;
                });

                return {
                    usuario_id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    cargo: usuario.cargo,
                    total_faltas: faltas.length,
                    dias_falta: faltas
                };
            })
            .filter(u => u.total_faltas > 0);

        return res.json(relatorio);

    } catch (err) {

        return res.status(500).json({
            error: 'Erro interno.',
            detalhe: err.message
        });
    }
};

// =========================================
// RELATÓRIO DE ATRASOS
// =========================================
exports.relatorioAtrasos = async (req, res) => {

    const { tenant_id, data_inicio, data_fim } = req.query;

    if (!tenant_id || !data_inicio || !data_fim) {

        return res.status(400).json({
            error: 'tenant_id, data_inicio e data_fim são obrigatórios.'
        });
    }

    try {

        const gerente_id = req.user.id;

        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select('id, nome, email, cargo')
            .eq('tenant_id', tenant_id)
            .eq('gerente_id', gerente_id);

        if (usuariosError) {

            return res.status(500).json({
                error: usuariosError.message
            });
        }

        const usuariosIds =
            usuarios.map(u => u.id);

        const { data: pontos, error: pontosError } = await supabase
            .from('pontos')
            .select('usuario_id, horario, tipo')
            .eq('tenant_id', tenant_id)
            .eq('tipo', 'entrada')
            .in('usuario_id', usuariosIds)
            .gte('horario', `${data_inicio}T00:00:00`)
            .lte('horario', `${data_fim}T23:59:59`);

        if (pontosError) {

            return res.status(500).json({
                error: pontosError.message
            });
        }

        const HORARIO_LIMITE = 8 * 60 + 5;

        const atrasos = [];

        pontos?.forEach(ponto => {

            const data = new Date(ponto.horario);

            const minutosEntrada =
                data.getHours() * 60 + data.getMinutes();

            if (minutosEntrada > HORARIO_LIMITE) {

                const usuario = usuarios.find(
                    u => u.id === ponto.usuario_id
                );

                const minutosAtraso =
                    minutosEntrada - (8 * 60);

                atrasos.push({
                    usuario_id: ponto.usuario_id,
                    nome: usuario?.nome,
                    email: usuario?.email,
                    cargo: usuario?.cargo,
                    data: data.toISOString().split('T')[0],
                    horario_entrada: data
                        .toTimeString()
                        .slice(0, 5),
                    minutos_atraso: minutosAtraso
                });
            }
        });

        return res.json(atrasos);

    } catch (err) {

        return res.status(500).json({
            error: 'Erro interno.',
            detalhe: err.message
        });
    }
};

// =========================================
// RELATÓRIO BANCO DE HORAS
// =========================================
exports.relatorioBancoHoras = async (req, res) => {

    const { tenant_id, data_inicio, data_fim } = req.query;

    if (!tenant_id || !data_inicio || !data_fim) {

        return res.status(400).json({
            error: 'tenant_id, data_inicio e data_fim são obrigatórios.'
        });
    }

    try {

        const gerente_id = req.user.id;

        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select('id, nome, email, cargo')
            .eq('tenant_id', tenant_id)
            .eq('gerente_id', gerente_id);

        if (usuariosError) {

            return res.status(500).json({
                error: usuariosError.message
            });
        }

        const usuariosIds =
            usuarios.map(u => u.id);

        const { data: pontos, error: pontosError } = await supabase
            .from('pontos')
            .select('usuario_id, horario, tipo')
            .eq('tenant_id', tenant_id)
            .in('usuario_id', usuariosIds)
            .gte('horario', `${data_inicio}T00:00:00`)
            .lte('horario', `${data_fim}T23:59:59`)
            .order('horario', { ascending: true });

        if (pontosError) {

            return res.status(500).json({
                error: pontosError.message
            });
        }

        const JORNADA_MINUTOS = 8 * 60;

        const porUsuarioDia = {};

        pontos?.forEach(ponto => {

            const dia =
                ponto.horario.split('T')[0];

            const chave =
                `${ponto.usuario_id}_${dia}`;

            if (!porUsuarioDia[chave]) {

                porUsuarioDia[chave] = {
                    usuario_id: ponto.usuario_id,
                    dia,
                    pontos: []
                };
            }

            porUsuarioDia[chave].pontos.push(ponto);
        });

        const relatorio = [];

        Object.values(porUsuarioDia).forEach(
            ({ usuario_id, dia, pontos }) => {

                const get = tipo =>
                    pontos.find(p => p.tipo === tipo);

                const entrada = get('entrada');
                const almoco = get('almoco');
                const retorno = get('retorno_almoco');
                const saida = get('saida');

                if (!entrada || !saida) return;

                const toMin = iso => {

                    const d = new Date(iso);

                    return (
                        d.getHours() * 60 +
                        d.getMinutes()
                    );
                };

                let trabalhado =
                    toMin(saida.horario) -
                    toMin(entrada.horario);

                if (almoco && retorno) {

                    const pausaAlmoco =
                        toMin(retorno.horario) -
                        toMin(almoco.horario);

                    trabalhado -= pausaAlmoco;
                }

                const saldo =
                    trabalhado - JORNADA_MINUTOS;

                const usuario = usuarios.find(
                    u => u.id === usuario_id
                );

                relatorio.push({
                    usuario_id,
                    nome: usuario?.nome,
                    cargo: usuario?.cargo,
                    dia,
                    minutos_trabalhados: trabalhado,
                    horas_trabalhadas:
                        `${Math.floor(trabalhado / 60)}h${String(trabalhado % 60).padStart(2, '0')}m`,
                    saldo_minutos: saldo,
                    saldo:
                        saldo >= 0
                            ? `+${Math.floor(saldo / 60)}h${String(saldo % 60).padStart(2, '0')}m`
                            : `-${Math.floor(Math.abs(saldo) / 60)}h${String(Math.abs(saldo) % 60).padStart(2, '0')}m`
                });
            }
        );

        return res.json(relatorio);

    } catch (err) {

        return res.status(500).json({
            error: 'Erro interno.',
            detalhe: err.message
        });
    }
};


// =========================================
// RELATÓRIO DE FÉRIAS
// =========================================
exports.relatorioFerias = async (req, res) => {

    const { tenant_id } = req.query;

    if (!tenant_id) {

        return res.status(400).json({
            error: 'tenant_id é obrigatório.'
        });
    }

    try {

        const gerente_id = req.user.id;

        // =========================
        // FUNCIONÁRIOS
        // =========================

        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select(`
                id,
                nome,
                email,
                cargo
            `)
            .eq('tenant_id', tenant_id)
            .eq('gerente_id', gerente_id);

        if (usuariosError) {

            return res.status(500).json({
                error: usuariosError.message
            });
        }

        const usuariosIds =
            usuarios.map(u => u.id);

        // =========================
        // FÉRIAS
        // =========================

        const { data: ferias, error: feriasError } = await supabase
            .from('ferias')
            .select('*')
            .eq('tenant_id', tenant_id)
            .in('usuario_id', usuariosIds)
            .order('data_ferias_prevista', {
                ascending: true
            });

        if (feriasError) {

            return res.status(500).json({
                error: feriasError.message
            });
        }

        const hoje = new Date();

        const relatorio = usuarios.map(usuario => {

            const feriasUsuario =
                ferias.filter(
                    f => f.usuario_id === usuario.id
                );

            // =========================
            // PENDENTES
            // =========================

            const pendentes =
                feriasUsuario.filter(
                    f => f.status_ferias === 'pendente'
                );

            // =========================
            // CUMPRIDAS
            // =========================

            const cumpridas =
                feriasUsuario.filter(
                    f => f.status_ferias === 'cumprida'
                );

            // =========================
            // ÚLTIMA FÉRIAS CUMPRIDA
            // =========================

            const ultimaCumprida =
                cumpridas.length > 0
                    ? cumpridas.reduce(
                        (maisRecente, atual) => {

                            const dataMaisRecente =
                                new Date(
                                    maisRecente.data_fim ||
                                    maisRecente.data_inicio
                                );

                            const dataAtual =
                                new Date(
                                    atual.data_fim ||
                                    atual.data_inicio
                                );

                            return dataAtual > dataMaisRecente
                                ? atual
                                : maisRecente;
                        }
                    )
                    : null;

            // =========================
            // FÉRIAS PENDENTE MAIS ANTIGA
            // =========================

            const maisAntigaPendente =
                pendentes.length > 0
                    ? pendentes.reduce(
                        (maisAntiga, atual) => {

                            const dataAntiga =
                                new Date(
                                    maisAntiga.data_ferias_prevista
                                );

                            const dataAtual =
                                new Date(
                                    atual.data_ferias_prevista
                                );

                            return dataAtual < dataAntiga
                                ? atual
                                : maisAntiga;
                        }
                    )
                    : null;

            // =========================
            // BASE PARA VENCIMENTO
            // =========================

            let dataBase = null;

            // funcionário já tirou férias
            if (ultimaCumprida) {

                dataBase =
                    ultimaCumprida.data_fim ||
                    ultimaCumprida.data_inicio;
            }

            // funcionário nunca tirou férias
            else if (pendentes.length > 0) {

                const primeiraPendente =
                    pendentes.reduce(
                        (maisAntiga, atual) => {

                            const dataAntiga =
                                new Date(
                                    maisAntiga.data_registro
                                );

                            const dataAtual =
                                new Date(
                                    atual.data_registro
                                );

                            return dataAtual < dataAntiga
                                ? atual
                                : maisAntiga;
                        }
                    );

                dataBase =
                    primeiraPendente.data_registro;
            }

            // =========================
            // DATA VENCIMENTO
            // =========================

            let dataVencimento = null;

            if (dataBase) {

                dataVencimento =
                    new Date(dataBase);

                dataVencimento.setMonth(
                    dataVencimento.getMonth() + 12
                );
            }

           // =========================
// =========================
// MESES PENDENTES
// =========================

let mesesPendente = 0;

// =========================
// FUNCIONÁRIO JÁ TIROU FÉRIAS
// =========================

if (
    ultimaCumprida &&
    maisAntigaPendente?.data_ferias_prevista
) {

    const dataPrevista =
        new Date(
            maisAntigaPendente.data_ferias_prevista
        );

    mesesPendente =
        (
            hoje.getFullYear() -
            dataPrevista.getFullYear()
        ) * 12;

    mesesPendente +=
        hoje.getMonth() -
        dataPrevista.getMonth();
}

// =========================
// FUNCIONÁRIO NUNCA TIROU FÉRIAS
// =========================

else if (dataBase) {

    const vencimento =
        new Date(dataBase);

    vencimento.setMonth(
        vencimento.getMonth() + 12
    );

    mesesPendente =
        (
            hoje.getFullYear() -
            vencimento.getFullYear()
        ) * 12;

    mesesPendente +=
        hoje.getMonth() -
        vencimento.getMonth();

    if (mesesPendente < 0) {
        mesesPendente = 0;
    }
}

            // =========================
            // SITUAÇÃO / AVISO
            // =========================

            let situacao = 'Em dia';

            let aviso =
                'Funcionário com situação regular.';

            let prioridade = 'baixa';

            if (mesesPendente >= 20) {

                situacao =
                    'Muito atrasada';

                prioridade =
                    'critica';

                aviso =
                    'Funcionário possui férias a vencer. Caso não marque nos próximos 30 dias, será realizada marcação compulsória.';

            } else if (mesesPendente >= 16) {

                situacao =
                    'Atrasada';

                prioridade =
                    'alta';

                aviso =
                    'Funcionário possui férias pendentes com prazo curto para agendamento.';

            } else if (mesesPendente >= 12) {

                situacao =
                    'Disponível';

                prioridade =
                    'media';

                aviso =
                    'Funcionário possui férias disponíveis para agendamento.';
            }

            return {

                usuario_id:
                    usuario.id,

                nome:
                    usuario.nome,

                email:
                    usuario.email,

                cargo:
                    usuario.cargo,

                // =====================
                // FRONTEND
                // =====================

                data_ultima_ferias:
                    ultimaCumprida?.data_fim ||
                    ultimaCumprida?.data_inicio ||
                    null,

                data_vencimento_ferias:
                    dataVencimento
                        ?.toISOString()
                        .split('T')[0] || null,

                // =====================
                // CONTROLE
                // =====================

                ferias_pendentes:
                    pendentes.length,

                ferias_cumpridas:
                    cumpridas.length,

                meses_pendente:
                    mesesPendente,

                // =====================
                // STATUS
                // =====================

                situacao,
                aviso,
                prioridade
            };
        });

        // =========================
        // ORDENAÇÃO
        // =========================

        const ordemPrioridade = {
            critica: 0,
            alta: 1,
            media: 2,
            baixa: 3
        };

        relatorio.sort((a, b) => {

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

        return res.json(relatorio);

    } catch (err) {

        return res.status(500).json({
            error: 'Erro interno.',
            detalhe: err.message
        });
    }
};

// =========================================
// RELATÓRIO DE AFASTAMENTOS
// =========================================
exports.relatorioAfastamentos = async (req, res) => {

    const { tenant_id } = req.query;

    if (!tenant_id) {

        return res.status(400).json({
            error: 'tenant_id é obrigatório.'
        });
    }

    try {

        const gerente_id = req.user.id;

        const { data: usuarios } = await supabase
            .from('usuarios')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('gerente_id', gerente_id);

        const usuariosIds =
            usuarios.map(u => u.id);

        const hoje =
            new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('atestados')
            .select('*, usuarios(nome, email, cargo)')
            .eq('tenant_id', tenant_id)
            .eq('status', 'ativo')
            .in('usuario_id', usuariosIds)
            .gte('data_emissao', hoje);

        if (error) {

            return res.status(500).json({
                error: error.message
            });
        }

        const relatorio = data.map(atestado => {

            const dataFim =
                new Date(atestado.data_emissao);

            dataFim.setDate(
                dataFim.getDate() +
                atestado.dias_afastamento
            );

            return {
                ...atestado,
                data_fim_afastamento:
                    dataFim
                        .toISOString()
                        .split('T')[0]
            };
        });

        return res.json(relatorio);

    } catch (err) {

        return res.status(500).json({
            error: 'Erro interno.',
            detalhe: err.message
        });
    }
};