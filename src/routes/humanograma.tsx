import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getToken, PageShell, Card, BackButton, Logo } from "@/components/minddesk";
import {
  Smile,
  Meh,
  Frown,
  X,
  TrendingUp,
  ShieldAlert,
  HeartPulse,
  ChevronRight,
  Stethoscope,
  Sparkles,
  Brain,
} from "lucide-react";

export const Route = createFileRoute("/humanograma")({
  component: HumanogramaPage,
});

type Funcionario = {
  id: number;
  nome: string;
  cargo: string;
  departamento: string;
  turnover: number;
  promocao: number;
  engajamento: number;
  sentimento: "feliz" | "neutro" | "triste";
  afastado: boolean;
  resumoIA: string;
};

const PEOPLE: Funcionario[] = [
  {
    id: 1,
    nome: "Ana Souza",
    cargo: "Designer",
    departamento: "Produto",
    turnover: 18,
    promocao: 72,
    engajamento: 84,
    sentimento: "feliz",
    afastado: false,
    resumoIA:
      "Ana demonstra alto engajamento e iniciativa em projetos de redesign. Seu histórico de entregas é consistente e recebeu feedbacks positivos nas últimas avaliações. Apresenta baixo risco de saída e está pronta para assumir responsabilidades de liderança no próximo ciclo. Recomenda-se incluí-la no programa de mentoria sênior.",
  },
  {
    id: 2,
    nome: "Carlos Lima",
    cargo: "Dev. Backend",
    departamento: "Tecnologia",
    turnover: 64,
    promocao: 30,
    engajamento: 41,
    sentimento: "neutro",
    afastado: false,
    resumoIA:
      "Carlos apresenta sinais de desengajamento nas últimas semanas — participação reduzida em reuniões e entregas com leve atraso. Seu risco de turnover é moderado-alto. Recomenda-se uma conversa de alinhamento para entender motivações e explorar possíveis ajustes no escopo ou remuneração. Atenção prioritária do RH.",
  },
  {
    id: 3,
    nome: "Mariana Reis",
    cargo: "Produto",
    departamento: "Produto",
    turnover: 9,
    promocao: 85,
    engajamento: 91,
    sentimento: "feliz",
    afastado: false,
    resumoIA:
      "Mariana é uma das colaboradoras com maior potencial da empresa. Alta elegibilidade para promoção, excelente relacionamento interpessoal e capacidade de entrega acima da média. Candidata natural para a vaga de Gerente de Produto que se abrirá no Q3. Risco de perda extremamente baixo.",
  },
  {
    id: 4,
    nome: "João Pedro",
    cargo: "Comercial",
    departamento: "Vendas",
    turnover: 82,
    promocao: 14,
    engajamento: 28,
    sentimento: "triste",
    afastado: false,
    resumoIA:
      "João Pedro apresenta os maiores índices de risco da equipe — turnover crítico, engajamento baixo e sentimento negativo confirmado nas pesquisas de pulso. Recomenda-se intervenção imediata: reunião 1:1 com liderança direta e RH, revisão de metas e avaliação de fit cultural. Sem ação, probabilidade alta de desligamento voluntário em 30 dias.",
  },
  {
    id: 5,
    nome: "Lúcia M.",
    cargo: "Financeiro",
    departamento: "Finanças",
    turnover: 22,
    promocao: 48,
    engajamento: 67,
    sentimento: "neutro",
    afastado: true,
    resumoIA:
      "Lúcia está em licença médica desde a semana passada. Antes do afastamento, apresentava indicadores estáveis com leve crescimento no engajamento. Recomenda-se acompanhamento humanizado no retorno, com possível ajuste temporário de carga. Seu histórico de performance é positivo e ela é bem-vista pela equipe.",
  },
];

const sentimentoConfig = {
  feliz: {
    icon: <Smile size={14} />,
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-500/20",
    label: "Satisfeito",
    dot: "bg-emerald-500",
  },
  neutro: {
    icon: <Meh size={14} />,
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-500/20",
    label: "Estável",
    dot: "bg-amber-500",
  },
  triste: {
    icon: <Frown size={14} />,
    bg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-500/20",
    label: "Desmotivado",
    dot: "bg-rose-500",
  },
} as const;

const GRADS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-fuchsia-600",
];

function Avatar({ nome, size = "md" }: { nome: string; size?: "sm" | "md" }) {
  const parts = nome.split(" ");
  const initials =
    parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].substring(0, 2);
  const grad = GRADS[nome.length % GRADS.length];
  const dim = size === "sm" ? "w-9 h-9 text-xs" : "w-12 h-12 text-sm";
  return (
    <div
      className={`${dim} rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm flex-shrink-0`}
    >
      <span className="text-white font-bold tracking-wider uppercase">{initials}</span>
    </div>
  );
}

// Mini pill score shown on the card
function ScorePill({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  const color = danger
    ? value > 60
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400"
      : value > 30
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
    : value > 60
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
    : value > 30
    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
    : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold ${color}`}>
      {label} {value}%
    </span>
  );
}

// Bar used inside the modal
function Bar({ value, danger }: { value: number; danger?: boolean }) {
  const color = danger
    ? value > 60
      ? "bg-rose-500"
      : value > 30
      ? "bg-amber-500"
      : "bg-emerald-500"
    : value > 60
    ? "bg-emerald-500"
    : value > 30
    ? "bg-amber-500"
    : "bg-rose-500";
  return (
    <div className="flex items-center gap-3 mt-2">
      <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right text-zinc-700 dark:text-white/80">
        {value}%
      </span>
    </div>
  );
}

function HumanogramaPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState<Funcionario | null>(null);

  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  return (
    <PageShell>
      <div className="min-h-screen px-4 sm:px-6 lg:px-12 py-6 sm:py-10 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.06),transparent_40%)]">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
          <Logo />
          <BackButton />
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-5 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-xl">
            {/* TÍTULO */}
            <div className="mb-8 border-b border-black/5 dark:border-white/10 pb-6">
              <div className="flex items-center gap-2.5 mb-2">
                <HeartPulse size={22} className="text-violet-500" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  Humanograma
                </h1>
              </div>
              <p className="text-sm text-zinc-500 dark:text-white/60 leading-relaxed max-w-3xl">
                Monitore a saúde organizacional da sua equipe. Clique em um colaborador para ver
                análise detalhada e o resumo gerado pela IA.
              </p>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PEOPLE.map((p) => {
                const cfg = sentimentoConfig[p.sentimento];
                return (
                  <button
                    key={p.id}
                    onClick={() => setOpen(p)}
                    className="text-left p-4 rounded-[24px] border border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-white dark:hover:bg-white/[0.04] hover:border-violet-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col gap-3"
                  >
                    {/* Top row: avatar + name + icons */}
                    <div className="flex items-center gap-3">
                      <Avatar nome={p.nome} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate group-hover:text-violet-500 transition-colors">
                          {p.nome}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-white/45 font-medium mt-0.5">
                          {p.cargo} · {p.departamento}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Sentimento badge */}
                        <div
                          className={`w-7 h-7 rounded-xl ${cfg.bg} ${cfg.text} flex items-center justify-center`}
                          title={`Humor: ${cfg.label}`}
                        >
                          {cfg.icon}
                        </div>
                        {p.afastado && (
                          <div
                            className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500"
                            title="Licença Médica"
                          >
                            <Stethoscope size={13} />
                          </div>
                        )}
                        <ChevronRight
                          size={14}
                          className="text-zinc-300 dark:text-white/20 group-hover:translate-x-0.5 group-hover:text-violet-400 transition-all ml-0.5 hidden sm:block"
                        />
                      </div>
                    </div>

                    {/* Score pills row */}
                    <div className="flex flex-wrap gap-1.5">
                      <ScorePill label="Turnover" value={p.turnover} danger />
                      <ScorePill label="Promoção" value={p.promocao} />
                      <ScorePill label="Engaj." value={p.engajamento} />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL */}
      {open && (
        <div
          className="fixed inset-0 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md grid place-items-center z-50 p-4"
          onClick={() => setOpen(null)}
        >
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <Card className="w-full rounded-[32px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#151518] shadow-2xl overflow-hidden">
              
              {/* Header do modal */}
              <div className="px-6 pt-6 pb-5 border-b border-black/5 dark:border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <Avatar nome={open.nome} size="md" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{open.nome}</h2>
                    <p className="text-sm text-zinc-500 dark:text-white/45">
                      {open.cargo} · {open.departamento}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(null)}
                    className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Score metrics */}
                <div className="grid grid-cols-1 gap-3">
                  <MetricRow
                    icon={<ShieldAlert size={15} className="text-zinc-400" />}
                    label="Risco de Turnover"
                    value={open.turnover}
                    danger
                  />
                  <MetricRow
                    icon={<TrendingUp size={15} className="text-zinc-400" />}
                    label="Elegibilidade para Promoção"
                    value={open.promocao}
                  />
                  <MetricRow
                    icon={<HeartPulse size={15} className="text-zinc-400" />}
                    label="Engajamento"
                    value={open.engajamento}
                  />
                </div>

                {/* Sentimento + Afastamento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06]">
                    <p className="text-[11px] text-zinc-400 dark:text-white/30 uppercase tracking-wider font-medium mb-2">
                      Sentimento
                    </p>
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${sentimentoConfig[open.sentimento].bg} ${sentimentoConfig[open.sentimento].text}`}
                    >
                      {sentimentoConfig[open.sentimento].icon}
                      {sentimentoConfig[open.sentimento].label}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06]">
                    <p className="text-[11px] text-zinc-400 dark:text-white/30 uppercase tracking-wider font-medium mb-2">
                      Afastamento
                    </p>
                    {open.afastado ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                        <Stethoscope size={12} />
                        Licença médica
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400 dark:text-white/30">—</span>
                    )}
                  </div>
                </div>

                {/* Resumo de IA */}
                <div className="rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-gradient-to-br from-violet-50 to-indigo-50/50 dark:from-violet-500/[0.07] dark:to-indigo-500/[0.04] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-violet-500/15 flex items-center justify-center">
                      <Sparkles size={13} className="text-violet-500" />
                    </div>
                    <span className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                      Resumo da IA
                    </span>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-white/75 leading-relaxed">
                    {open.resumoIA}
                  </p>
                </div>

                <p className="text-[11px] text-zinc-400 dark:text-white/30 text-center leading-relaxed">
                  * Indicadores analíticos de exemplo. Conecte sua base corporativa para dados reais.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function MetricRow({
  icon,
  label,
  value,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/[0.06]">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-zinc-700 dark:text-white/80">{label}</span>
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-white">{value}%</span>
      </div>
      <Bar value={value} danger={danger} />
    </div>
  );
}

export default HumanogramaPage;