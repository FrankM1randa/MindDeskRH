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

        const usuariosIds = usuarios.map(u => u.id);

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

        const usuariosIds = usuarios.map(u => u.id);

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

        const usuariosIds = usuarios.map(u => u.id);

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

            const dia = ponto.horario.split('T')[0];

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

                const get = (tipo) =>
                    pontos.find(p => p.tipo === tipo);

                const entrada = get('entrada');
                const almoco = get('almoco');
                const retorno = get('retorno_almoco');
                const saida = get('saida');

                if (!entrada || !saida) return;

                const toMin = (iso) => {

                    const d = new Date(iso);

                    return d.getHours() * 60 +
                        d.getMinutes();
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

        const { data: usuarios } = await supabase
            .from('usuarios')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('gerente_id', gerente_id);

        const usuariosIds = usuarios.map(u => u.id);

        const hoje = new Date();

        const { data, error } = await supabase
            .from('ferias')
            .select(`
                *,
                usuarios(
                    nome,
                    email,
                    cargo,
                    data_contratacao
                )
            `)
            .eq('tenant_id', tenant_id)
            .in('usuario_id', usuariosIds)
            .order('created_at', {
                ascending: false
            });

        if (error) {
            return res.status(500).json({
                error: error.message
            });
        }

        // remove registros duplicados
        const mapaFuncionarios = {};

        data.forEach(item => {

            if (!mapaFuncionarios[item.usuario_id]) {
                mapaFuncionarios[item.usuario_id] = item;
            }
        });

        const relatorio = Object.values(mapaFuncionarios)
            .map(ferias => {

                let alerta = null;
                let prioridade = 0;

                const dataContratacao =
                    ferias.usuarios?.data_contratacao;

                let statusVisual = 'Em dia';

                if (dataContratacao) {

                    const admissao = new Date(
                        dataContratacao
                    );

                    const mesesEmpresa =
                        (hoje.getFullYear() - admissao.getFullYear()) * 12 +
                        (hoje.getMonth() - admissao.getMonth());

                    // funcionário já pode tirar férias
                    if (mesesEmpresa >= 12) {

                        const mesesAtraso =
                            mesesEmpresa - 12;

                        if (mesesAtraso >= 8) {

                            statusVisual = 'Crítica';

                            prioridade = 1;

                            alerta = {
                                nivel: 'critico',
                                mensagem:
                                    'Férias muito atrasadas'
                            };

                        } else if (mesesAtraso >= 5) {

                            statusVisual = 'Atrasada';

                            prioridade = 2;

                            alerta = {
                                nivel: 'urgente',
                                mensagem:
                                    'Férias atrasadas'
                            };

                        } else if (mesesAtraso >= 2) {

                            statusVisual = 'Pendente';

                            prioridade = 3;

                            alerta = {
                                nivel: 'aviso',
                                mensagem:
                                    'Férias pendentes'
                            };

                        } else {

                            statusVisual = 'Em dia';

                            prioridade = 4;
                        }
                    }
                }

                return {
                    ...ferias,
                    status_visual: statusVisual,
                    prioridade,
                    alerta
                };
            })

            // ordena prioridade
            .sort((a, b) => {

                if (a.prioridade !== b.prioridade) {
                    return a.prioridade - b.prioridade;
                }

                return a.usuarios.nome.localeCompare(
                    b.usuarios.nome
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

        const usuariosIds = usuarios.map(u => u.id);

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

            const dataFim = new Date(
                atestado.data_emissao
            );

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