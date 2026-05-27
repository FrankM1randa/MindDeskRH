const supabase = require('../config/supabase');

// Relatório de Faltas
exports.relatorioFaltas = async (req, res) => {
    const { tenant_id, data_inicio, data_fim } = req.query;

    if (!tenant_id || !data_inicio || !data_fim) {
        return res.status(400).json({ error: 'tenant_id, data_inicio e data_fim são obrigatórios.' });
    }

    try {
        // Busca todos os usuários do tenant
        const { data: usuarios } = await supabase
            .from('usuarios')
            .select('id, nome, email, cargo')
            .eq('tenant_id', tenant_id);

        // Busca todos os pontos do período
        const { data: pontos } = await supabase
            .from('pontos')
            .select('usuario_id, horario, tipo')
            .eq('tenant_id', tenant_id)
            .gte('horario', `${data_inicio}T00:00:00`)
            .lte('horario', `${data_fim}T23:59:59`);

        // Gera lista de dias úteis no período (seg-sex)
        const diasUteis = [];
        const atual = new Date(data_inicio);
        const fim = new Date(data_fim);

        while (atual <= fim) {
            const diaSemana = atual.getDay();
            if (diaSemana !== 0 && diaSemana !== 6) {
                diasUteis.push(atual.toISOString().split('T')[0]);
            }
            atual.setDate(atual.getDate() + 1);
        }

        // Verifica faltas por usuário
        const relatorio = usuarios.map(usuario => {
            const faltas = diasUteis.filter(dia => {
                const temEntrada = pontos?.some(p =>
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
        }).filter(u => u.total_faltas > 0);

        return res.json(relatorio);

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
    }
};

// Relatório de Atrasos (tolerância de 5 minutos após 08:00)
exports.relatorioAtrasos = async (req, res) => {
    const { tenant_id, data_inicio, data_fim } = req.query;

    if (!tenant_id || !data_inicio || !data_fim) {
        return res.status(400).json({ error: 'tenant_id, data_inicio e data_fim são obrigatórios.' });
    }

    try {
        const { data: pontos } = await supabase
            .from('pontos')
            .select('usuario_id, horario, tipo')
            .eq('tenant_id', tenant_id)
            .eq('tipo', 'entrada')
            .gte('horario', `${data_inicio}T00:00:00`)
            .lte('horario', `${data_fim}T23:59:59`);

        const { data: usuarios } = await supabase
            .from('usuarios')
            .select('id, nome, email, cargo')
            .eq('tenant_id', tenant_id);

        const HORARIO_LIMITE = 8 * 60 + 5; // 08:05 em minutos

        const atrasos = [];

        pontos?.forEach(ponto => {
            const data = new Date(ponto.horario);
            const minutosEntrada = data.getHours() * 60 + data.getMinutes();

            if (minutosEntrada > HORARIO_LIMITE) {
                const usuario = usuarios.find(u => u.id === ponto.usuario_id);
                const minutosAtraso = minutosEntrada - (8 * 60); // atraso real desde 08:00

                atrasos.push({
                    usuario_id: ponto.usuario_id,
                    nome: usuario?.nome,
                    email: usuario?.email,
                    cargo: usuario?.cargo,
                    data: data.toISOString().split('T')[0],
                    horario_entrada: data.toTimeString().slice(0, 5),
                    minutos_atraso: minutosAtraso
                });
            }
        });

        return res.json(atrasos);

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
    }
};

// Banco de Horas (jornada 8h trabalhadas, descontando 1h de almoço)
exports.relatorioBancoHoras = async (req, res) => {
    const { tenant_id, data_inicio, data_fim } = req.query;

    if (!tenant_id || !data_inicio || !data_fim) {
        return res.status(400).json({ error: 'tenant_id, data_inicio e data_fim são obrigatórios.' });
    }

    try {
        const { data: pontos } = await supabase
            .from('pontos')
            .select('usuario_id, horario, tipo')
            .eq('tenant_id', tenant_id)
            .gte('horario', `${data_inicio}T00:00:00`)
            .lte('horario', `${data_fim}T23:59:59`)
            .order('horario', { ascending: true });

        const { data: usuarios } = await supabase
            .from('usuarios')
            .select('id, nome, email, cargo')
            .eq('tenant_id', tenant_id);

        const JORNADA_MINUTOS = 8 * 60; // 8h trabalhadas

        // Agrupa pontos por usuário e dia
        const porUsuarioDia = {};

        pontos?.forEach(ponto => {
            const dia = ponto.horario.split('T')[0];
            const chave = `${ponto.usuario_id}_${dia}`;

            if (!porUsuarioDia[chave]) {
                porUsuarioDia[chave] = { usuario_id: ponto.usuario_id, dia, pontos: [] };
            }
            porUsuarioDia[chave].pontos.push(ponto);
        });

        const relatorio = [];

        Object.values(porUsuarioDia).forEach(({ usuario_id, dia, pontos }) => {
            const get = (tipo) => pontos.find(p => p.tipo === tipo);

            const entrada = get('entrada');
            const almoco = get('almoco');
            const retorno = get('retorno_almoco');
            const saida = get('saida');

            if (!entrada || !saida) return;

            const toMin = (iso) => {
                const d = new Date(iso);
                return d.getHours() * 60 + d.getMinutes();
            };

            // Calcula horas trabalhadas descontando almoço
            let trabalhado = toMin(saida.horario) - toMin(entrada.horario);

            if (almoco && retorno) {
                const pausaAlmoco = toMin(retorno.horario) - toMin(almoco.horario);
                trabalhado -= pausaAlmoco;
            }

            const saldo = trabalhado - JORNADA_MINUTOS;
            const usuario = usuarios.find(u => u.id === usuario_id);

            relatorio.push({
                usuario_id,
                nome: usuario?.nome,
                cargo: usuario?.cargo,
                dia,
                minutos_trabalhados: trabalhado,
                horas_trabalhadas: `${Math.floor(trabalhado / 60)}h${String(trabalhado % 60).padStart(2, '0')}m`,
                saldo_minutos: saldo,
                saldo: saldo >= 0
                    ? `+${Math.floor(saldo / 60)}h${String(saldo % 60).padStart(2, '0')}m`
                    : `-${Math.floor(Math.abs(saldo) / 60)}h${String(Math.abs(saldo) % 60).padStart(2, '0')}m`
            });
        });

        return res.json(relatorio);

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
    }
};

// Relatório de Férias
exports.relatorioFerias = async (req, res) => {
    const { tenant_id } = req.query;

    if (!tenant_id) {
        return res.status(400).json({ error: 'tenant_id é obrigatório.' });
    }

    try {
        const { data, error } = await supabase
            .from('ferias')
            .select(`
                *,
                usuarios (nome, email, cargo)
            `)
            .eq('tenant_id', tenant_id)
            .order('data_inicio', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });

        return res.json(data);

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
    }
};

// Relatório de Afastamentos Vigentes
exports.relatorioAfastamentos = async (req, res) => {
    const { tenant_id } = req.query;

    if (!tenant_id) {
        return res.status(400).json({ error: 'tenant_id é obrigatório.' });
    }

    try {
        const hoje = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('atestados')
            .select(`
                *,
                usuarios (nome, email, cargo)
            `)
            .eq('tenant_id', tenant_id)
            .eq('status', 'ativo')
            .gte('data_emissao', hoje);

        if (error) return res.status(500).json({ error: error.message });

        // Calcula data fim do afastamento
        const relatorio = data.map(atestado => {
            const dataFim = new Date(atestado.data_emissao);
            dataFim.setDate(dataFim.getDate() + atestado.dias_afastamento);

            return {
                ...atestado,
                data_fim_afastamento: dataFim.toISOString().split('T')[0]
            };
        });

        return res.json(relatorio);

    } catch (err) {
        return res.status(500).json({ error: 'Erro interno.', detalhe: err.message });
    }
};