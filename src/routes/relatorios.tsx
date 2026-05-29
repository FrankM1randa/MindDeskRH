import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  getToken,
  PageShell,
  BackButton,
  Logo,
  API,
  TENANT_ID,
  authHeaders,
} from "@/components/minddesk";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

export const Route = createFileRoute("/relatorios")({
  component: RelatoriosPage,
});

const REPORTS = [
  {
    id: "faltas",
    title: "Faltas",
    icon: "🚫",
    desc: "Ausências registradas no período",
  },
  {
    id: "atrasos",
    title: "Atrasos",
    icon: "⏰",
    desc: "Chegadas após o horário",
  },
  {
    id: "horas",
    title: "Banco de horas",
    icon: "⌛",
    desc: "Saldo de horas dos funcionários",
  },
  {
    id: "ferias",
    title: "Férias",
    icon: "🏖️",
    desc: "Férias pendentes e programadas",
  },
  {
    id: "afastamentos",
    title: "Afastamentos",
    icon: "🩺",
    desc: "Atestados e licenças vigentes",
  },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground text-center py-12">
      Nenhum dado encontrado.
    </p>
  );
}

function ChartFaltas({ data }: any) {
  const chartData = data.map((item: any) => ({
    name: item.nome?.split(" ")[0],
    faltas: item.total_faltas,
  }));

  return (
    <div className="w-full h-[280px] -ml-4 pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          {/* Rotação aplicada no texto do eixo X para não encavalar no mobile */}
          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Bar
            dataKey="faltas"
            fill="#e03131"
            name="Faltas"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartAtrasos({ data }: any) {
  const grouped: Record<string, number> = {};

  data.forEach((item: any) => {
    grouped[item.nome] =
      (grouped[item.nome] || 0) + item.minutos_atraso;
  });

  // Pega apenas o primeiro nome para caber perfeitamente na barra lateral do mobile
  const chartData = Object.entries(grouped).map(([name, minutos]) => ({
    name: name.split(" ")[0],
    minutos,
  }));

  return (
    <div className="w-full h-[280px] -ml-6 pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
          <Tooltip />
          <Bar
            dataKey="minutos"
            fill="#f76707"
            name="Minutos"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartHoras({ data }: any) {
  const chartData = data.map((item: any) => ({
    nome: item.nome?.split(" ")[0],
    saldo: Number((item.saldo_minutos / 60).toFixed(1)),
  }));

  return (
    <div className="w-full h-[280px] -ml-4 pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="nome" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={50} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="saldo" name="Saldo (h)" radius={[4, 4, 0, 0]}>
            {chartData.map((entry: any, index: number) => (
              <Cell
                key={index}
                fill={entry.saldo >= 0 ? "#2f9e44" : "#e03131"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
function TabelaFerias({ data }: any) {
  function formatarData(data?: string) {
    if (!data) return "-";
    return data.split("-").reverse().join("/");
  }

  // Tratamento robusto para remover acentos e maiúsculas
  function normalizarTexto(texto: string) {
    return texto
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") || "";
  }

  function corSituacao(situacao: string) {
    const sit = normalizarTexto(situacao);
    switch (sit) {
      case "muito atrasada":
      case "critica":
        return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
      case "atrasada":
      case "alta":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400";
      case "disponivel":
      case "media":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400";
      case "em dia":
      case "baixa":
        return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    }
  }

  function corTextoAviso(situacao: string) {
    const sit = normalizarTexto(situacao);
    switch (sit) {
      case "muito atrasada":
      case "critica":
        return "text-red-600 dark:text-red-400";
      case "atrasada":
      case "alta":
        return "text-orange-600 dark:text-orange-400";
      case "disponivel":
      case "media":
        return "text-yellow-600 dark:text-yellow-400";
      case "em dia":
      case "baixa":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-muted-foreground";
    }
  }

  const ordemPrioridade: Record<string, number> = {
    critica: 1,
    alta: 2,
    media: 3,
    baixa: 4,
  };

  const dadosOrdenados = [...data].sort((a: any, b: any) => {
    const pa = ordemPrioridade[normalizarTexto(a.prioridade)] ?? 99;
    const pb = ordemPrioridade[normalizarTexto(b.prioridade)] ?? 99;
    if (pa !== pb) return pa - pb;
    return (b.meses_pendente || 0) - (a.meses_pendente || 0);
  });

  return (
    <div className="space-y-5">
      {/* Grid de Mini Cards Superiores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">Muito atrasadas</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {dadosOrdenados.filter((i: any) => {
              const sit = normalizarTexto(i.situacao || i.prioridade);
              return sit === "muito atrasada" || sit === "critica";
            }).length}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">Atrasadas</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {dadosOrdenados.filter((i: any) => {
              const sit = normalizarTexto(i.situacao || i.prioridade);
              return sit === "atrasada" || sit === "alta";
            }).length}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">Disponíveis</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {dadosOrdenados.filter((i: any) => {
              const sit = normalizarTexto(i.situacao || i.prioridade);
              return sit === "disponivel" || sit === "media";
            }).length}
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">Funcionários</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            {dadosOrdenados.length}
          </div>
        </div>
      </div>

      {/* Lista de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dadosOrdenados.map((item: any, index: number) => (
          <div
            key={index}
            className="rounded-2xl border border-border bg-card p-4 flex flex-col justify-between space-y-3 shadow-sm hover:border-primary/40 transition-colors"
          >
            {/* Cabeçalho do Card */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-base text-card-foreground">{item.nome || "-"}</h4>
                <p className="text-xs text-muted-foreground">{item.cargo || "-"}</p>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wider ${corSituacao(item.situacao || item.prioridade)}`}>
                {item.situacao || item.prioridade || "Em Dia"}
              </span>
            </div>

            <hr className="border-border" />

            {/* Grid Interno */}
            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Últimas Férias:</span>
                <span className="font-medium text-card-foreground">{formatarData(item.data_ultima_ferias)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-0.5">Próximo Vencimento:</span>
                <span className="font-medium text-card-foreground">{formatarData(item.data_vencimento_ferias)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-0.5">Períodos Pendentes:</span>
                <span className="font-bold text-sm bg-muted px-2.5 py-0.5 rounded-md inline-block">
                  {item.ferias_pendentes || 0}
                </span>
              </div>
            </div>

            {/* Bloco de Aviso dinâmico */}
            {item.aviso && (
              <div className="pt-1 mt-auto">
                <div className="bg-muted/40 rounded-xl p-3 text-xs border border-border/50">
                  <span className={`font-semibold leading-relaxed ${corTextoAviso(item.situacao || item.prioridade)}`}>
                    {item.aviso}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabelaAfastamentos({ data }: any) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
          <tr>
            <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Funcionário</th>
            <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Motivo</th>
            <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Fim do Afastamento</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {data.map((item: any, index: number) => (
            <tr
              key={index}
              className="hover:bg-muted/40 transition-colors"
            >
              <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                {item.usuarios?.nome}
              </td>

              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {item.motivo || "Afastamento"}
              </td>

              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {item.data_fim_afastamento
                  ?.split("-")
                  .reverse()
                  .join("/")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RelatoriosPage() {
  const navigate = useNavigate();

  const [open, setOpen] = useState<string | null>(null);
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [loading, setLoading] = useState(false);
  const [dados, setDados] = useState<any[]>([]);

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  async function carregarRelatorio(tipo: string) {
    try {
      setLoading(true);
      let endpoint = "";

      switch (tipo) {
        case "faltas": endpoint = "faltas"; break;
        case "atrasos": endpoint = "atrasos"; break;
        case "horas": endpoint = "banco-horas"; break;
        case "ferias": endpoint = "ferias"; break;
        case "afastamentos": endpoint = "afastamentos"; break;
        default: return;
      }

      let url = `${API}/relatorios/${endpoint}?tenant_id=${TENANT_ID}`;

      if (tipo !== "ferias" && tipo !== "afastamentos") {
        url += `&data_inicio=${from}&data_fim=${to}`;
      }

      const response = await fetch(url, {
        headers: authHeaders(),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Erro ao carregar relatório");
      }

      setDados(json);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      carregarRelatorio(open);
    }
  }, [open, from, to]);

  const report = useMemo(
    () => REPORTS.find((r) => r.id === open),
    [open]
  );

  function renderContent() {
    if (loading) return <Loading />;
    if (!dados?.length) return <EmptyState />;

    switch (open) {
      case "faltas":
        return (
          <div className="space-y-6">
            <ChartFaltas data={dados} />

            <div className="space-y-2">
              {dados.map((item: any, index: number) => (
                <div
                  key={index}
                  className="border border-border bg-card rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{item.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.cargo}</p>
                    </div>

                    <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-bold shrink-0">
                      {item.total_faltas} {item.total_faltas === 1 ? "falta" : "faltas"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "atrasos":
        return (
          <div className="space-y-6">
            <ChartAtrasos data={dados} />

            <div className="space-y-2">
              {dados.map((item: any, index: number) => (
                <div
                  key={index}
                  className="border border-border bg-card rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{item.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.data?.split("-").reverse().join("/")}
                      </p>
                    </div>

                    <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-bold shrink-0">
                      {item.minutos_atraso} min
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "horas": {
        const agrupado: Record<
          string,
          {
            nome: string;
            cargo: string;
            totalMinutos: number;
            diasComSaldo: number;
          }
        > = {};

        dados.forEach((item: any) => {
          const saldo = Number(item.saldo_minutos || 0);
          if (saldo === 0) return;

          if (!agrupado[item.nome]) {
            agrupado[item.nome] = {
              nome: item.nome,
              cargo: item.cargo || "-",
              totalMinutos: 0,
              diasComSaldo: 0,
            };
          }

          agrupado[item.nome].totalMinutos += saldo;
          agrupado[item.nome].diasComSaldo += 1;
        });

        const funcionarios = Object.values(agrupado).sort(
          (a, b) => Math.abs(b.totalMinutos) - Math.abs(a.totalMinutos)
        );

        function formatarSaldo(minutos: number) {
          const negativo = minutos < 0;
          const abs = Math.abs(minutos);
          const horas = Math.floor(abs / 60);
          const mins = abs % 60;

          return `${negativo ? "-" : "+"}${horas}h ${mins
            .toString()
            .padStart(2, "0")}min`;
        }

        return (
          <div className="space-y-5">
            {/* Cards de Métricas do Banco de Horas agrupando 2x2 no Mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-border p-3.5 bg-card">
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Funcionários</div>
                <div className="text-xl font-bold mt-0.5">{funcionarios.length}</div>
              </div>

              <div className="rounded-xl border border-border p-3.5 bg-card">
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Positivos</div>
                <div className="text-xl font-bold text-green-600 mt-0.5">
                  {funcionarios.filter((f) => f.totalMinutos > 0).length}
                </div>
              </div>

              <div className="rounded-xl border border-border p-3.5 bg-card">
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Negativos</div>
                <div className="text-xl font-bold text-red-600 mt-0.5">
                  {funcionarios.filter((f) => f.totalMinutos < 0).length}
                </div>
              </div>

              <div className="rounded-xl border border-border p-3.5 bg-card">
                <div className="text-[11px] text-muted-foreground uppercase font-medium">Movimentações</div>
                <div className="text-xl font-bold text-blue-600 mt-0.5">
                  {dados.filter((d: any) => Number(d.saldo_minutos || 0) !== 0).length}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 text-foreground">
                Saldo total por funcionário
              </h3>
              <ChartHoras data={dados} />
            </div>

            <div className="space-y-2">
              {funcionarios.map((item: any, index: number) => (
                <div
                  key={index}
                  className="border border-border rounded-xl p-4 bg-card shadow-sm"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-foreground truncate">{item.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.cargo}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Dias ativos: {item.diasComSaldo}
                      </p>
                    </div>

                    <div
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 ${item.totalMinutos >= 0
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                        }`}
                    >
                      {formatarSaldo(item.totalMinutos)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "ferias":
        return <TabelaFerias data={dados} />;

      case "afastamentos":
        return <TabelaAfastamentos data={dados} />;

      default:
        return null;
    }
  }

  return (
    <PageShell>
      <div className="min-h-screen px-4 py-6 max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <Logo />
          <BackButton />
        </header>

        {/* Ajuste do grid principal de relatórios: 1 coluna no mobile para não quebrar a UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpen(r.id)}
              className="text-left p-4 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md transition-all flex items-start gap-4 active:scale-[0.99]"
            >
              <div className="text-2xl p-2.5 bg-secondary rounded-xl shrink-0">{r.icon}</div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground leading-tight">
                  {r.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {r.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Drawer / Modal Inferior Mobile-friendly */}
      {open && report && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-background w-full max-w-2xl rounded-t-3xl p-5 pb-8 max-h-[92vh] overflow-y-auto border-t border-border animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="text-xl p-1.5 bg-secondary rounded-lg">{report.icon}</span>
                <h2 className="text-base font-semibold text-foreground">
                  Relatório de {report.title}
                </h2>
              </div>

              <button
                onClick={() => setOpen(null)}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-muted flex items-center justify-center font-medium text-muted-foreground"
              >
                ✕
              </button>
            </div>

            {open !== "ferias" && open !== "afastamentos" && (
              <div className="flex gap-3 mb-6 bg-muted/40 p-3 rounded-xl border border-border">
                <div className="flex-1">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Início
                  </label>
                  <input
                    type="date"
                    value={from}
                    max={to}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex-1">
                  <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Fim
                  </label>
                  <input
                    type="date"
                    value={to}
                    min={from}
                    max={today()}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div className="mt-2">{renderContent()}</div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default RelatoriosPage;