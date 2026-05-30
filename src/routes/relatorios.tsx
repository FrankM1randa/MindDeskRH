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
  BarChart3,
  Clock3,
  CalendarDays,
  BriefcaseMedical,
  TimerReset,
  Ban,
  ChevronRight,
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

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

import relatorioIllus from "@/assets/illus-relatorios.png";

export const Route = createFileRoute("/relatorios")({
  component: RelatoriosPage,
});

const REPORTS = [
  {
    id: "faltas",
    title: "Faltas",
    icon: <Ban size={20} />,
    desc: "Ausências registradas no período",
  },
  {
    id: "atrasos",
    title: "Atrasos",
    icon: <Clock3 size={20} />,
    desc: "Chegadas após o horário",
  },
  {
    id: "horas",
    title: "Banco de horas",
    icon: <TimerReset size={20} />,
    desc: "Saldo de horas dos funcionários",
  },
  {
    id: "ferias",
    title: "Férias",
    icon: <CalendarDays size={20} />,
    desc: "Férias pendentes e programadas",
  },
  {
    id: "afastamentos",
    title: "Afastamentos",
    icon: <BriefcaseMedical size={20} />,
    desc: "Atestados e licenças vigentes",
  },
];

const isDark =
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

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
    <div className="flex items-center justify-center py-16">
      <div className="w-10 h-10 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center">
        <BarChart3 size={26} className="text-zinc-400" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-white/50">
        Nenhum dado encontrado.
      </p>
    </div>
  );
}

function ChartFaltas({ data }: any) {
  const chartData = data.map((item: any) => ({
    name: item.nome?.split(" ")[0],
    faltas: item.total_faltas,
  }));

  return (
    <div className="w-full h-[300px] -ml-4 pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#71717a" }} angle={-45} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 12, fill: isDark ? "#a1a1aa" : "#71717a" }} allowDecimals={false} />
          <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", color: isDark ? "#f3f4f6" : "#1f2937", borderRadius: "12px" }} itemStyle={{ color: isDark ? "#f3f4f6" : "#1f2937" }} labelStyle={{ color: isDark ? "#9ca3af" : "#4b5563" }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12, color: isDark ? "#e4e4e7" : "#3f3f46" }} />
          <Bar dataKey="faltas" fill="#ef4444" radius={[8, 8, 0, 0]} name="Faltas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartAtrasos({ data }: any) {
  const grouped: Record<string, number> = {};
  data.forEach((item: any) => {
    grouped[item.nome] = (grouped[item.nome] || 0) + item.minutos_atraso;
  });
  const chartData = Object.entries(grouped).map(([name, minutos]) => ({
    name: name.split(" ")[0],
    minutos,
  }));

  return (
    <div className="w-full h-[300px] -ml-5 pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.15} />
          <XAxis type="number" tick={{ fontSize: 12, fill: isDark ? "#a1a1aa" : "#71717a" }} />
          <YAxis type="category" dataKey="name" width={55} tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#71717a" }} />
          <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", color: isDark ? "#f3f4f6" : "#1f2937", borderRadius: "12px" }} itemStyle={{ color: isDark ? "#f3f4f6" : "#1f2937" }} labelStyle={{ color: isDark ? "#9ca3af" : "#4b5563" }} />
          <Bar dataKey="minutos" fill="#f97316" radius={[0, 8, 8, 0]} name="Minutos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartHoras({ data }: any) {
  const chartData = data.map((item: any) => ({
    nome: item.nome?.split(" ")[0],
    saldo: Number(((item.saldo_minutos || 0) / 60).toFixed(1)),
  }));

  return (
    <div className="w-full h-[300px] -ml-4 pr-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
          <XAxis dataKey="nome" tick={{ fontSize: 11, fill: isDark ? "#a1a1aa" : "#71717a" }} angle={-45} textAnchor="end" height={55} />
          <YAxis tick={{ fontSize: 12, fill: isDark ? "#a1a1aa" : "#71717a" }} />
          <Tooltip contentStyle={{ backgroundColor: isDark ? "#1f2937" : "#ffffff", borderColor: isDark ? "#374151" : "#e5e7eb", color: isDark ? "#f3f4f6" : "#1f2937", borderRadius: "12px" }} itemStyle={{ color: isDark ? "#f3f4f6" : "#1f2937" }} labelStyle={{ color: isDark ? "#9ca3af" : "#4b5563" }} />
          <Bar dataKey="saldo" radius={[8, 8, 0, 0]} name="Saldo">
            {chartData.map((entry: any, index: number) => (
              <Cell key={index} fill={entry.saldo >= 0 ? "#22c55e" : "#ef4444"} />
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

  function normalizarTexto(texto: string) {
    return texto?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
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

  const dadosOrdenados = [...data];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
          <div className="text-xs text-zinc-500 dark:text-white/50">Funcionários</div>
          <div className="text-2xl font-bold mt-1">{dadosOrdenados.length}</div>
        </div>
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
          <div className="text-xs text-zinc-500 dark:text-white/50">Críticas</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {dadosOrdenados.filter((i: any) => { const sit = normalizarTexto(i.situacao || i.prioridade); return sit === "muito atrasada" || sit === "critica"; }).length}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
          <div className="text-xs text-zinc-500 dark:text-white/50">Atenção</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">
            {dadosOrdenados.filter((i: any) => { const sit = normalizarTexto(i.situacao || i.prioridade); return sit === "atrasada" || sit === "alta"; }).length}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
          <div className="text-xs text-zinc-500 dark:text-white/50">Disponíveis</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {dadosOrdenados.filter((i: any) => { const sit = normalizarTexto(i.situacao || i.prioridade); return sit === "disponivel" || sit === "media" || sit === "em dia"; }).length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dadosOrdenados.map((item: any, index: number) => (
          <div key={index} className="rounded-[28px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-white">{item.nome || "-"}</h4>
                <p className="text-xs text-zinc-500 dark:text-white/50 mt-1">{item.cargo || "-"}</p>
              </div>
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${corSituacao(item.situacao || item.prioridade)}`}>
                {item.situacao || item.prioridade || "Em dia"}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-zinc-500 dark:text-white/50">Últimas férias</div>
                <div className="font-medium mt-1 text-zinc-900 dark:text-white">{formatarData(item.data_ultima_ferias)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 dark:text-white/50">Vencimento</div>
                <div className="font-medium mt-1 text-zinc-900 dark:text-white">{formatarData(item.data_vencimento_ferias)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-zinc-500 dark:text-white/50">Períodos pendentes</div>
                <div className="mt-1 inline-flex px-3 py-1 rounded-lg bg-zinc-100 dark:bg-white/[0.06] font-semibold text-zinc-900 dark:text-white">
                  {item.ferias_pendentes || 0}
                </div>
              </div>
            </div>
            {item.aviso && (
              <div className="mt-5 rounded-2xl bg-zinc-100 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 p-4 text-sm text-zinc-700 dark:text-white/70">
                {item.aviso}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NOVO: Componente de Afastamentos com abas e busca ───────────────────────

type AbaAfastamento = "pendente" | "aprovado" | "recusado";

function TabelaAfastamentos({ data, onUpdateStatus }: { data: any[]; onUpdateStatus: (id: string, status: string) => void }) {
  const [aba, setAba] = useState<AbaAfastamento>("pendente");
  const [busca, setBusca] = useState("");

  const abas: { id: AbaAfastamento; label: string; icon: React.ReactNode; cor: string }[] = [
    {
      id: "pendente",
      label: "Pendentes",
      icon: <Clock size={14} />,
      cor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      id: "aprovado",
      label: "Aceitos",
      icon: <CheckCircle2 size={14} />,
      cor: "text-green-600 dark:text-green-400",
    },
    {
      id: "recusado",
      label: "Recusados",
      icon: <XCircle size={14} />,
      cor: "text-red-600 dark:text-red-400",
    },
  ];

  const counts = {
    pendente: data.filter((i) => i.status === "pendente").length,
    aprovado: data.filter((i) => i.status === "aprovado").length,
    recusado: data.filter((i) => i.status === "recusado").length,
  };

  const filtrados = data.filter((item) => {
    const nome = (item.usuarios?.nome || item.nome || "").toLowerCase();
    const matchBusca = nome.includes(busca.toLowerCase());
    const matchAba = item.status === aba;
    return matchBusca && matchAba;
  });

  function formatarData(data?: string) {
    if (!data) return "-";
    return data.split("-").reverse().join("/");
  }

  function badgeAba(status: string) {
    switch (status) {
      case "aprovado":
        return "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400";
      case "recusado":
        return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400";
      default:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400";
    }
  }

  return (
    <div className="space-y-5">
      {/* Contador de cards por status */}
      <div className="grid grid-cols-3 gap-3">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`rounded-2xl border p-4 text-left transition-all ${
              aba === a.id
                ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                : "border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <div className={`flex items-center gap-1.5 text-xs font-medium mb-1 ${a.cor}`}>
              {a.icon}
              {a.label}
            </div>
            <div className="text-2xl font-bold text-zinc-900 dark:text-white">
              {counts[a.id]}
            </div>
          </button>
        ))}
      </div>

      {/* Campo de busca */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-white/30" />
        <input
          type="text"
          placeholder="Buscar por nome do funcionário..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm outline-none focus:border-primary/40 transition-colors placeholder:text-zinc-400 dark:placeholder:text-white/30"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-black/5 dark:border-white/10">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              aba === a.id
                ? "border-primary text-primary"
                : "border-transparent text-zinc-500 dark:text-white/50 hover:text-zinc-700 dark:hover:text-white/70"
            }`}
          >
            {a.icon}
            {a.label}
            {counts[a.id] > 0 && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  aba === a.id
                    ? "bg-primary/15 text-primary"
                    : "bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-white/50"
                }`}
              >
                {counts[a.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista de atestados */}
      {filtrados.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-3xl bg-zinc-100 dark:bg-white/[0.05] flex items-center justify-center">
            <BriefcaseMedical size={22} className="text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-white/50">
            {busca ? `Nenhum resultado para "${busca}"` : "Nenhum atestado nesta categoria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((item: any) => (
            <div
              key={item.id}
              className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                {/* Info do funcionário */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {(item.usuarios?.nome || item.nome || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">
                      {item.usuarios?.nome || item.nome || "—"}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-white/50">
                      {item.usuarios?.cargo || item.cargo || "Funcionário"}
                    </p>
                  </div>
                </div>

                {/* Badge de status */}
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 ${badgeAba(item.status)}`}>
                  {item.status || "pendente"}
                </span>
              </div>

              {/* Detalhes */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-zinc-500 dark:text-white/50">Motivo / CID</div>
                  <div className="font-medium mt-1 text-zinc-900 dark:text-white">
                    {item.motivo_cid || item.motivo || "Atestado"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 dark:text-white/50">Data de emissão</div>
                  <div className="font-medium mt-1 text-zinc-900 dark:text-white">
                    {formatarData(item.data_emissao)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 dark:text-white/50">Dias afastado</div>
                  <div className="font-medium mt-1 text-zinc-900 dark:text-white">
                    {item.dias_afastamento ?? "-"}
                  </div>
                </div>
              </div>

              {/* Link do arquivo */}
              {item.url_arquivo && (
                <a
                  href={item.url_arquivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                >
                  Ver atestado →
                </a>
              )}

              {/* Ações para pendentes */}
              {item.status === "pendente" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onUpdateStatus(item.id, "aprovado")}
                    className="flex-1 h-10 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 text-sm font-semibold hover:bg-green-500/20 transition-colors"
                  >
                    Aprovar
                  </button>
                  <button
                    onClick={() => onUpdateStatus(item.id, "recusado")}
                    className="flex-1 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-500/20 transition-colors"
                  >
                    Recusar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

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

      // Afastamentos: busca todos os atestados + pendentes em paralelo.
      // /atestados retorna sem join (sem nome), mas /atestados/pendentes
      // tem join com usuarios(nome,cargo). Mesclamos para ter nome em todos.
      if (tipo === "afastamentos") {
        const [todosRes, pendentesRes] = await Promise.all([
          fetch(`${API}/atestados?tenant_id=${TENANT_ID}`, { headers: authHeaders() }),
          fetch(`${API}/atestados/pendentes`, { headers: authHeaders() }),
        ]);

        const todos = todosRes.ok ? await todosRes.json() : [];
        const pendentes = pendentesRes.ok ? await pendentesRes.json() : [];

        // Monta mapa de id → dados do usuario vindos dos pendentes (que têm o join)
        const nomeMapa: Record<string, any> = {};
        (Array.isArray(pendentes) ? pendentes : []).forEach((p: any) => {
          if (p.usuario_id && p.usuarios?.nome) {
            nomeMapa[p.usuario_id] = p.usuarios;
          }
        });

        // Mescla: usa o nome do mapa quando /atestados não trouxe
        const resultado = (Array.isArray(todos) ? todos : []).map((item: any) => ({
          ...item,
          usuarios: {
            nome: item.usuarios?.nome || nomeMapa[item.usuario_id]?.nome || null,
            cargo: item.usuarios?.cargo || nomeMapa[item.usuario_id]?.cargo || null,
            email: item.usuarios?.email || nomeMapa[item.usuario_id]?.email || null,
          },
        }));

        setDados(resultado);
        return;
      }

      let endpoint = "";
      switch (tipo) {
        case "faltas":  endpoint = "faltas";      break;
        case "atrasos": endpoint = "atrasos";     break;
        case "horas":   endpoint = "banco-horas"; break;
        case "ferias":  endpoint = "ferias";      break;
        default: return;
      }

      let url = `${API}/relatorios/${endpoint}?tenant_id=${TENANT_ID}`;
      if (tipo !== "ferias") url += `&data_inicio=${from}&data_fim=${to}`;

      const response = await fetch(url, { headers: authHeaders() });
      const json = await response.json();

      if (!response.ok) throw new Error(json.error || "Erro ao carregar relatório");

      setDados(Array.isArray(json) ? json : []);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
      setDados([]);
    } finally {
      setLoading(false);
    }
  }

  // Atualiza o status de um atestado e reflete localmente sem re-fetch
  async function handleUpdateStatus(id: string, status: string) {
    try {
      const response = await fetch(`${API}/atestados/${id}/status`, {
        method: "PATCH",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || "Erro ao atualizar status");
      }

      // Atualiza localmente para evitar re-fetch desnecessário
      setDados((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      );
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  }

  useEffect(() => {
    if (open) {
      carregarRelatorio(open);
    }
  }, [open, from, to]);

  const report = useMemo(() => REPORTS.find((r) => r.id === open), [open]);

  function renderContent() {
    if (loading) return <Loading />;
    if (!dados?.length) return <EmptyState />;

    switch (open) {
      case "faltas":
        return (
          <div className="rounded-[28px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 sm:p-5 shadow-sm">
            <ChartFaltas data={dados} />
          </div>
        );
      case "atrasos":
        return (
          <div className="rounded-[28px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 sm:p-5 shadow-sm">
            <ChartAtrasos data={dados} />
          </div>
        );
      case "horas":
        return (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4 sm:p-5 shadow-sm">
              <ChartHoras data={dados} />
            </div>
          </div>
        );
      case "ferias":
        return <TabelaFerias data={dados} />;
      case "afastamentos":
        return <TabelaAfastamentos data={dados} onUpdateStatus={handleUpdateStatus} />;
      default:
        return null;
    }
  }

  return (
    <PageShell>
      <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_35%)]">
        <div className="max-w-6xl mx-auto">
          <header className="flex items-center justify-between mb-8">
            <Logo />
            <BackButton />
          </header>

          <div className="relative overflow-hidden rounded-[36px] border border-black/5 dark:border-white/10 bg-gradient-to-br from-[#0f172a] via-[#132554] to-[#0b1220] p-6 sm:p-8 lg:p-10 mb-8 shadow-[0_20px_80px_rgba(15,23,42,0.35)]">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-blue-500/20 blur-3xl rounded-full" />
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                  Relatórios
                </h1>
                <p className="mt-4 text-sm sm:text-lg text-white/70 leading-relaxed max-w-xl">
                  Visualize indicadores, métricas e informações importantes da equipe em tempo real.
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center flex-1">
                <img
                  src={relatorioIllus}
                  alt="Relatórios"
                  className="w-56 lg:w-72 xl:w-80 h-auto object-contain drop-shadow-[0_20px_50px_rgba(59,130,246,0.35)]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {REPORTS.map((r) => (
              <button
                key={r.id}
                onClick={() => setOpen(r.id)}
                className="group relative overflow-hidden rounded-[30px] p-5 border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                    {r.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-zinc-900 dark:text-white">{r.title}</div>
                    <div className="text-sm text-zinc-500 dark:text-white/50 mt-1 leading-relaxed">{r.desc}</div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {open && report && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-5"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full md:max-w-4xl max-h-[95vh] overflow-y-auto rounded-t-[34px] md:rounded-[34px] border border-black/5 dark:border-white/10 bg-white dark:bg-[#0f1115] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-20 px-5 sm:px-6 py-5 border-b border-black/5 dark:border-white/10 bg-white/90 dark:bg-[#0f1115]/90 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary">
                    {report.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Relatório de {report.title}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-white/50">{report.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(null)}
                  className="w-11 h-11 rounded-2xl bg-black/[0.04] dark:bg-white/[0.05] border border-black/5 dark:border-white/10 flex items-center justify-center text-zinc-600 dark:text-white/70 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {open !== "ferias" && open !== "afastamentos" && (
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-white/50">Início</label>
                    <input
                      type="date"
                      value={from}
                      max={to}
                      onChange={(e) => setFrom(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-white/50">Fim</label>
                    <input
                      type="date"
                      value={to}
                      min={from}
                      max={today()}
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full mt-1 h-12 px-4 rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] text-sm outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">{renderContent()}</div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

export default RelatoriosPage;