import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getToken, PageShell, Card, BackButton, Logo } from "@/components/minddesk";

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
  avatar: string;
};

const PEOPLE: Funcionario[] = [
  { id: 1, nome: "Ana Souza", cargo: "Designer", turnover: 18, promocao: 72, sentimento: "feliz", afastado: false, avatar: "👩🏻" },
  { id: 2, nome: "Carlos Lima", cargo: "Dev. Backend", turnover: 64, promocao: 30, sentimento: "neutro", afastado: false, avatar: "👨🏽" },
  { id: 3, nome: "Mariana Reis", cargo: "Produto", turnover: 9, promocao: 85, sentimento: "feliz", afastado: false, avatar: "👩🏼" },
  { id: 4, nome: "João Pedro", cargo: "Comercial", turnover: 82, promocao: 14, sentimento: "triste", afastado: false, avatar: "👨🏻" },
  { id: 5, nome: "Lúcia M.", cargo: "Financeiro", turnover: 22, promocao: 48, sentimento: "neutro", afastado: true, avatar: "👩🏽" },
];

const sentEmoji = { feliz: "😊", neutro: "😐", triste: "😟" } as const;

function bar(value: number, danger = false) {
  const color = danger
    ? value > 60 ? "bg-destructive" : value > 30 ? "bg-amber-500" : "bg-emerald-500"
    : value > 60 ? "bg-emerald-500" : value > 30 ? "bg-amber-500" : "bg-destructive";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold w-9 text-right">{value}%</span>
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
      <div className="min-h-screen px-6 lg:px-10 py-10">
        <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
          <Logo />
          <BackButton />
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight">Humanograma</h1>
              <p className="text-sm text-muted-foreground">
                Selecione um funcionário para ver indicadores de turnover, elegibilidade de promoção, sentimento (pulse) e afastamentos.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PEOPLE.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOpen(p)}
                  className="text-left p-4 rounded-2xl border-[1.5px] border-border bg-card hover:border-primary hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary grid place-items-center text-2xl">{p.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{p.nome}</div>
                    <div className="text-xs text-muted-foreground">{p.cargo}</div>
                  </div>
                  <div className="text-xl">{sentEmoji[p.sentimento]}</div>
                  {p.afastado && <span title="Afastado" className="text-xl">🤕</span>}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50 p-4" onClick={() => setOpen(null)}>
          <Card className="w-full max-w-lg p-7" >
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-secondary grid place-items-center text-4xl">{open.avatar}</div>
                <div>
                  <h2 className="text-xl font-semibold">{open.nome}</h2>
                  <p className="text-sm text-muted-foreground">{open.cargo}</p>
                </div>
                <button onClick={() => setOpen(null)} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
              </div>

              <div className="space-y-4">
                <Metric label="Possibilidade de turnover" value={open.turnover} danger />
                <Metric label="Elegibilidade para promoção" value={open.promocao} />
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border">
                  <span className="text-sm">Análise de sentimento (pulse)</span>
                  <span className="text-2xl">{sentEmoji[open.sentimento]}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border">
                  <span className="text-sm">Afastamento atual</span>
                  <span className="text-xl">{open.afastado ? "🤕 Sim" : "—"}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">* Indicadores de exemplo. Conecte sua base para dados reais.</p>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );

  function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
    return (
      <div className="p-3 rounded-xl bg-secondary/60 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{label}</span>
        </div>
        {bar(value, danger)}
      </div>
    );
  }
}
