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
  LineChart,
  Line,
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
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-muted-foreground text-center py-10">
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
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="faltas"
          fill="#e03131"
          name="Faltas"
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartAtrasos({ data }: any) {
  const grouped: Record<string, number> = {};

  data.forEach((item: any) => {
    grouped[item.nome] =
      (grouped[item.nome] || 0) + item.minutos_atraso;
  });

  const chartData = Object.entries(grouped).map(([name, minutos]) => ({
    name,
    minutos,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="name" width={80} />
        <Tooltip />
        <Bar
          dataKey="minutos"
          fill="#f76707"
          radius={[0, 6, 6, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartHoras({ data }: any) {
  const chartData = data.map((item: any) => ({
    nome: item.nome?.split(" ")[0],
    saldo: Number((item.saldo_minutos / 60).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="saldo" radius={[6, 6, 0, 0]}>
          {chartData.map((entry: any, index: number) => (
            <Cell
              key={index}
              fill={entry.saldo >= 0 ? "#2f9e44" : "#e03131"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TabelaFerias({ data }: any) {

  function formatarData(data?: string) {

    if (!data) return "-";

    return data
      .split("-")
      .reverse()
      .join("/");
  }

  function mesesEntre(datastring?: string) {

    if (!datastring) return 0;

    const hoje = new Date();

    const data = new Date(datastring);

    let meses =
      (hoje.getFullYear() - data.getFullYear()) * 12;

    meses += hoje.getMonth() - data.getMonth();

    return meses;
  }

  function obterSituacao(item: any) {

    if (item.status === "concluida") {
      return "Concluída";
    }

    if (item.status === "agendada") {
      return "Agendada";
    }

    const meses = mesesEntre(
      item.data_ferias_prevista
    );

    if (meses > 20) {
      return "Muito atrasada";
    }

    if (meses > 16) {
      return "Atrasada";
    }

    return "Pendente";
  }

  function obterMensagem(item: any) {

    if (item.status === "concluida") {
      return "Férias já cumpridas";
    }

    if (item.status === "agendada") {
      return "Férias agendadas";
    }

    const meses = mesesEntre(
      item.data_ferias_prevista
    );

    if (meses > 20) {
      return "Você possui férias a vencer. Caso não marque nos próximos 30 dias, será realizada marcação de férias compulsórias.";
    }

    if (meses > 16) {
      return "Você tem férias pendentes de agendamento com prazo curto, favor agendar suas férias.";
    }

    if (meses > 12) {
      return "Você está com férias disponíveis para agendar.";
    }

    return "Sem alerta";
  }

  function corSituacao(situacao: string) {

    switch (situacao) {

      case "Muito atrasada":
        return "bg-red-100 text-red-700";

      case "Atrasada":
        return "bg-orange-100 text-orange-700";

      case "Pendente":
        return "bg-yellow-100 text-yellow-700";

      case "Agendada":
        return "bg-blue-100 text-blue-700";

      case "Concluída":
        return "bg-green-100 text-green-700";

      default:
        return "bg-zinc-100 text-zinc-700";
    }
  }

  const prioridade = {
    "Muito atrasada": 1,
    "Atrasada": 2,
    "Pendente": 3,
    "Agendada": 4,
    "Concluída": 5,
  };

  const dadosOrdenados = [...data].sort(
    (a: any, b: any) => {

      const situacaoA = obterSituacao(a);
      const situacaoB = obterSituacao(b);

      const prioridadeA =
        prioridade[
        situacaoA as keyof typeof prioridade
        ];

      const prioridadeB =
        prioridade[
        situacaoB as keyof typeof prioridade
        ];

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB;
      }

      return (
        a.usuarios?.nome || ""
      ).localeCompare(
        b.usuarios?.nome || ""
      );
    }
  );

  return (

    <div className="space-y-5">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">
            Muito atrasadas
          </div>

          <div className="text-2xl font-bold text-red-600 mt-1">
            {
              dadosOrdenados.filter(
                (i: any) =>
                  obterSituacao(i) ===
                  "Muito atrasada"
              ).length
            }
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">
            Atrasadas
          </div>

          <div className="text-2xl font-bold text-orange-600 mt-1">
            {
              dadosOrdenados.filter(
                (i: any) =>
                  obterSituacao(i) ===
                  "Atrasada"
              ).length
            }
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">
            Agendadas
          </div>

          <div className="text-2xl font-bold text-blue-600 mt-1">
            {
              dadosOrdenados.filter(
                (i: any) =>
                  obterSituacao(i) ===
                  "Agendada"
              ).length
            }
          </div>
        </div>

        <div className="rounded-2xl border border-border p-4 bg-card">
          <div className="text-xs text-muted-foreground">
            Cumpridas
          </div>

          <div className="text-2xl font-bold text-green-600 mt-1">
            {
              dadosOrdenados.filter(
                (i: any) =>
                  obterSituacao(i) ===
                  "Concluída"
              ).length
            }
          </div>
        </div>

      </div>

      <div className="overflow-x-auto rounded-xl border border-border">

        <table className="w-full text-sm">

          <thead className="bg-primary text-primary-foreground">

            <tr>

              <th className="text-left px-4 py-3">
                Funcionário
              </th>

              <th className="text-left px-4 py-3">
                Cargo
              </th>

              <th className="text-left px-4 py-3">
                Situação
              </th>

              <th className="text-left px-4 py-3">
                Status
              </th>

              <th className="text-left px-4 py-3">
                Contratação
              </th>

              <th className="text-left px-4 py-3">
                Previsão
              </th>

              <th className="text-left px-4 py-3">
                Aviso
              </th>

            </tr>

          </thead>

          <tbody>

            {dadosOrdenados.map(
              (item: any, index: number) => {

                const situacao =
                  obterSituacao(item);

                const mensagem =
                  obterMensagem(item);

                return (

                  <tr
                    key={index}
                    className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                  >

                    <td className="px-4 py-3 font-medium">
                      {item.usuarios?.nome}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {item.usuarios?.cargo || "-"}
                    </td>

                    <td className="px-4 py-3">

                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${corSituacao(situacao)}`}
                      >
                        {situacao}
                      </span>

                    </td>

                    <td className="px-4 py-3 capitalize">
                      {item.status || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {formatarData(
                        item.usuarios
                          ?.data_contratacao
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {formatarData(
                        item.data_ferias_prevista
                      )}
                    </td>

                    <td className="px-4 py-3">

                      <div className="max-w-[320px] text-xs leading-5">

                        {mensagem === "Sem alerta" ? (

                          <span className="text-muted-foreground">
                            Sem alerta
                          </span>

                        ) : (

                          <span
                            className={`font-medium ${situacao ===
                              "Muito atrasada"
                              ? "text-red-700"
                              : situacao ===
                                "Atrasada"
                                ? "text-orange-700"
                                : situacao ===
                                  "Concluída"
                                  ? "text-green-700"
                                  : "text-yellow-700"
                              }`}
                          >
                            {mensagem}
                          </span>

                        )}

                      </div>

                    </td>

                  </tr>
                );
              }
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}

function TabelaAfastamentos({ data }: any) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-primary text-primary-foreground">
          <tr>
            <th className="text-left px-4 py-3">Funcionário</th>
            <th className="text-left px-4 py-3">Motivo</th>
            <th className="text-left px-4 py-3">Fim</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item: any, index: number) => (
            <tr
              key={index}
              className="border-b border-border last:border-0"
            >
              <td className="px-4 py-3">
                {item.usuarios?.nome}
              </td>

              <td className="px-4 py-3">
                {item.motivo || "Afastamento"}
              </td>

              <td className="px-4 py-3">
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
        case "faltas":
          endpoint = "faltas";
          break;

        case "atrasos":
          endpoint = "atrasos";
          break;

        case "horas":
          endpoint = "banco-horas";
          break;

        case "ferias":
          endpoint = "ferias";
          break;

        case "afastamentos":
          endpoint = "afastamentos";
          break;

        default:
          return;
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
          <div className="space-y-5">
            <ChartFaltas data={dados} />

            <div className="space-y-3">
              {dados.map((item: any, index: number) => (
                <div
                  key={index}
                  className="border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.nome}</p>

                      <p className="text-sm text-muted-foreground">
                        {item.cargo}
                      </p>
                    </div>

                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {item.total_faltas} faltas
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "atrasos":
        return (
          <div className="space-y-5">
            <ChartAtrasos data={dados} />

            <div className="space-y-3">
              {dados.map((item: any, index: number) => (
                <div
                  key={index}
                  className="border border-border rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.nome}</p>

                      <p className="text-sm text-muted-foreground">
                        {item.data
                          ?.split("-")
                          .reverse()
                          .join("/")}
                      </p>
                    </div>

                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
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

        const funcionarios = Object.values(agrupado)
          .sort(
            (a, b) =>
              Math.abs(b.totalMinutos) -
              Math.abs(a.totalMinutos)
          );

        const chartData = funcionarios.map((item) => ({
          nome: item.nome.split(" ")[0],
          saldoHoras: Number(
            (item.totalMinutos / 60).toFixed(1)
          ),
        }));

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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              <div className="rounded-2xl border border-border p-4 bg-card">

                <div className="text-xs text-muted-foreground">
                  Funcionários
                </div>

                <div className="text-2xl font-bold mt-1">
                  {funcionarios.length}
                </div>

              </div>

              <div className="rounded-2xl border border-border p-4 bg-card">

                <div className="text-xs text-muted-foreground">
                  Banco positivo
                </div>

                <div className="text-2xl font-bold text-green-600 mt-1">
                  {
                    funcionarios.filter(
                      (f) => f.totalMinutos > 0
                    ).length
                  }
                </div>

              </div>

              <div className="rounded-2xl border border-border p-4 bg-card">

                <div className="text-xs text-muted-foreground">
                  Banco negativo
                </div>

                <div className="text-2xl font-bold text-red-600 mt-1">
                  {
                    funcionarios.filter(
                      (f) => f.totalMinutos < 0
                    ).length
                  }
                </div>

              </div>

              <div className="rounded-2xl border border-border p-4 bg-card">

                <div className="text-xs text-muted-foreground">
                  Dias com saldo
                </div>

                <div className="text-2xl font-bold text-blue-600 mt-1">
                  {dados.filter(
                    (d: any) =>
                      Number(d.saldo_minutos || 0) !== 0
                  ).length}
                </div>

              </div>

            </div>

            <div className="rounded-2xl border border-border bg-card p-4">

              <h3 className="font-semibold mb-4">
                Saldo total por funcionário
              </h3>

              <ResponsiveContainer width="100%" height={320}>

                <BarChart data={chartData}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="nome" />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="saldoHoras"
                    radius={[6, 6, 0, 0]}
                  >

                    {chartData.map(
                      (entry: any, index: number) => (

                        <Cell
                          key={index}
                          fill={
                            entry.saldoHoras >= 0
                              ? "#2f9e44"
                              : "#e03131"
                          }
                        />

                      )
                    )}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </div>

            <div className="space-y-3">

              {funcionarios.map(
                (item: any, index: number) => (

                  <div
                    key={index}
                    className="border border-border rounded-2xl p-4 bg-card"
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <p className="font-semibold text-base">
                          {item.nome}
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {item.cargo}
                        </p>

                        <p className="text-xs text-muted-foreground mt-2">
                          Dias com movimentação:
                          {" "}
                          {item.diasComSaldo}
                        </p>

                      </div>

                      <div
                        className={`px-4 py-2 rounded-xl text-sm font-bold ${item.totalMinutos >= 0
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                          }`}
                      >

                        {formatarSaldo(
                          item.totalMinutos
                        )}

                      </div>

                    </div>

                  </div>

                )
              )}

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
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <BackButton />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {REPORTS.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpen(r.id)}
              className="text-left p-4 rounded-2xl border border-border bg-card hover:border-primary hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">{r.icon}</div>

              <div className="text-sm font-semibold">
                {r.title}
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                {r.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {open && report && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setOpen(null)}
        >
          <div
            className="bg-card w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">{report.icon}</span>

                <h2 className="text-lg font-semibold">
                  {report.title}
                </h2>
              </div>

              <button
                onClick={() => setOpen(null)}
                className="w-8 h-8 rounded-full hover:bg-secondary"
              >
                ✕
              </button>
            </div>

            {open !== "ferias" &&
              open !== "afastamentos" && (
                <div className="flex gap-3 mb-5">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">
                      Início
                    </label>

                    <input
                      type="date"
                      value={from}
                      max={to}
                      onChange={(e) =>
                        setFrom(e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </div>

                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">
                      Fim
                    </label>

                    <input
                      type="date"
                      value={to}
                      min={from}
                      max={today()}
                      onChange={(e) =>
                        setTo(e.target.value)
                      }
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background"
                    />
                  </div>
                </div>
              )}

            {renderContent()}
          </div>
        </div>
      )}
    </PageShell>
  );
}