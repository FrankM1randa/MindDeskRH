import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getToken, PageShell, Card, BackButton, Logo } from "@/components/minddesk";
import { 
  Smile, 
  Meh, 
  Frown, 
  AlertCircle, 
  X, 
  TrendingUp, 
  ShieldAlert, 
  HeartPulse,
  ChevronRight,
  Stethoscope
} from "lucide-react";

export const Route = createFileRoute("/humanograma")({
  component: HumanogramaPage,
});

type Funcionario = {
  id: number;
  nome: string;
  cargo: string;
  turnover: number; // 0-100
  promocao: number; // 0-100
  sentimento: "feliz" | "neutro" | "triste";
  afastado: boolean;
};

const PEOPLE: Funcionario[] = [
  { id: 1, nome: "Ana Souza", cargo: "Designer", turnover: 18, promocao: 72, sentimento: "feliz", afastado: false },
  { id: 2, nome: "Carlos Lima", cargo: "Dev. Backend", turnover: 64, promocao: 30, sentimento: "neutro", afastado: false },
  { id: 3, nome: "Mariana Reis", cargo: "Produto", turnover: 9, promocao: 85, sentimento: "feliz", afastado: false },
  { id: 4, nome: "João Pedro", cargo: "Comercial", turnover: 82, promocao: 14, sentimento: "triste", afastado: false },
  { id: 5, nome: "Lúcia M.", cargo: "Financeiro", turnover: 22, promocao: 48, sentimento: "neutro", afastado: true },
];

const sentimentoConfig = {
  feliz: {
    icon: <Smile size={20} className="text-emerald-500" />,
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Satisfeito",
  },
  neutro: {
    icon: <Meh size={20} className="text-amber-500" />,
    bg: "bg-amber-50 dark:bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    label: "Estável",
  },
  triste: {
    icon: <Frown size={20} className="text-rose-500" />,
    bg: "bg-rose-50 dark:bg-rose-500/10",
    text: "text-rose-600 dark:text-rose-400",
    label: "Desmotivado",
  },
} as const;

function GetInitials({ nome }: { nome: string }) {
  const parts = nome.split(" ");
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].substring(0, 2);
  
  const grads = [
    "from-blue-500 to-indigo-600",
    "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-violet-500 to-fuchsia-600"
  ];
  const selectedGrad = grads[nome.length % grads.length];

  return (
    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedGrad} flex items-center justify-center shadow-sm flex-shrink-0`}>
      <span className="text-white font-bold text-sm tracking-wider uppercase">{initials}</span>
    </div>
  );
}

function bar(value: number, danger = false) {
  const color = danger
    ? value > 60 ? "bg-rose-500" : value > 30 ? "bg-amber-500" : "bg-emerald-500"
    : value > 60 ? "bg-emerald-500" : value > 30 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-bold w-10 text-right text-zinc-700 dark:text-white">{value}%</span>
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

        {/* CONTEÚDO PRINCIPAL */}
        <div className="max-w-5xl mx-auto">
          <Card className="p-5 sm:p-8 rounded-[32px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] shadow-xl">
            
            {/* TÍTULO DA TELA */}
            <div className="mb-8 border-b border-black/5 dark:border-white/10 pb-6">
              <div className="flex items-center gap-2.5 mb-2">
                <HeartPulse size={22} className="text-violet-500" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Humanograma</h1>
              </div>
              <p className="text-sm text-zinc-500 dark:text-white/60 leading-relaxed max-w-3xl">
                Monitore a saúde organizacional da sua equipe. Selecione um colaborador abaixo para analisar o risco de turnover, o engajamento de promoção e o pulso de sentimento atual.
              </p>
            </div>

            {/* GRID DE COLABORADORES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PEOPLE.map((p) => {
                const config = sentimentoConfig[p.sentimento];
                return (
                  <button
                    key={p.id}
                    onClick={() => setOpen(p)}
                    className="text-left p-4 rounded-[24px] border border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-white/[0.01] hover:bg-white dark:hover:bg-white/[0.04] hover:border-violet-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 group"
                  >
                    <GetInitials nome={p.nome} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate group-hover:text-violet-500 transition-colors">
                        {p.nome}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-white/45 font-medium mt-0.5">
                        {p.cargo}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-xl ${config.bg} flex items-center justify-center`} title={`Humor: ${config.label}`}>
                        {config.icon}
                      </div>

                      {/* Ícone de afastamento atualizado para Stethoscope */}
                      {p.afastado && (
                        <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-500" title="Licença Médica">
                          <Stethoscope size={16} />
                        </div>
                      )}
                      
                      <ChevronRight size={16} className="text-zinc-300 dark:text-white/20 group-hover:translate-x-0.5 transition-transform ml-1 hidden sm:block" />
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* DETALHES (MODAL) */}
      {open && (
        <div 
          className="fixed inset-0 bg-zinc-950/40 dark:bg-black/60 backdrop-blur-md grid place-items-center z-50 p-4 animate-fade-in" 
          onClick={() => setOpen(null)}
        >
          {/* A div abaixo intercepta o clique impedindo o erro no Card */}
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <Card className="w-full p-6 sm:p-7 rounded-[32px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#151518] shadow-2xl animate-scale-up">
              
              {/* Cabeçalho do Modal */}
              <div className="flex items-center gap-4 mb-6 border-b border-black/5 dark:border-white/5 pb-5 relative">
                <GetInitials nome={open.nome} />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">{open.nome}</h2>
                  <p className="text-sm font-medium text-zinc-500 dark:text-white/45">{open.cargo}</p>
                </div>
                <button 
                  onClick={() => setOpen(null)} 
                  className="absolute top-0 right-0 p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Métricas e Cards Internos */}
              <div className="space-y-4">
                <Metric 
                  label="Possibilidade de Turnover (Risco de Saída)" 
                  value={open.turnover} 
                  icon={<ShieldAlert size={16} className="text-zinc-500" />}
                  danger 
                />
                
                <Metric 
                  label="Elegibilidade para Promoção" 
                  value={open.promocao} 
                  icon={<TrendingUp size={16} className="text-zinc-500" />}
                />
                
                {/* Linha de Sentimento */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <HeartPulse size={16} className="text-zinc-400 dark:text-white/30" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-white/80">Análise de sentimento (Pulse)</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs uppercase tracking-wider ${sentimentoConfig[open.sentimento].bg} ${sentimentoConfig[open.sentimento].text}`}>
                    {sentimentoConfig[open.sentimento].icon}
                    <span>{sentimentoConfig[open.sentimento].label}</span>
                  </div>
                </div>

                {/* Linha de Afastamento atualizada para Stethoscope */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={16} className="text-zinc-400 dark:text-white/30" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-white/80">Afastamento atual</span>
                  </div>
                  {open.afastado ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 uppercase tracking-wider">
                      Licença Médica
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-zinc-400 dark:text-white/30">—</span>
                  )}
                </div>
              </div>
              
              {/* Nota de rodapé explicativa */}
              <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-white/35 mt-6 text-center">
                * Os indicadores acima são dados analíticos de exemplo. Conecte sua base corporativa para sincronizar dados reais em tempo real.
              </p>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );

  function Metric({ label, value, icon, danger }: { label: string; value: number; icon: React.ReactNode; danger?: boolean }) {
    return (
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-sm font-semibold text-zinc-800 dark:text-white/90">{label}</span>
        </div>
        {bar(value, danger)}
      </div>
    );
  }
}

export default HumanogramaPage;