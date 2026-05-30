import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  API,
  authHeaders,
  useRequireAuth,
  PageShell,
  Card,
  BackButton,
  Logo,
  Alert,
} from "@/components/minddesk";
import docsIllus from "@/assets/illus-docs.png";

export const Route = createFileRoute("/cursos")({
  component: CursosPage,
});

type Curso = {
  id: number;
  titulo: string;
  descricao?: string;
  cargaHoraria?: number;
  concluido: boolean;
  concluidoEm?: string;
  data_limite?: string; // Nova propriedade mapeada vinda da API
};

function CursosPage() {
  useRequireAuth();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState<{
    msg: string;
    type: "error" | "success";
  }>({
    msg: "",
    type: "error",
  });

  const [aba, setAba] = useState<"pendentes" | "concluidos">("pendentes");

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cursos`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCursos(data || []);
    } catch {
      // Mock de segurança caso falhe, adicionado campo data_limite para testes locais
      setCursos([
        {
          id: 1,
          titulo: "Compliance e Ética",
          descricao: "Princípios de conduta corporativa.",
          cargaHoraria: 4,
          concluido: false,
          data_limite: "2026-06-15",
        },
        {
          id: 2,
          titulo: "Segurança no Trabalho",
          descricao: "NRs essenciais e prevenção de acidentes.",
          cargaHoraria: 6,
          concluido: false,
          data_limite: "2026-05-20", // Data passada para testar o 'Atrasado'
        },
        {
          id: 3,
          titulo: "LGPD para Colaboradores",
          descricao: "Boas práticas com dados pessoais.",
          cargaHoraria: 3,
          concluido: true,
          concluidoEm: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const concluirCurso = async (curso: Curso) => {
    setAlert({ msg: "", type: "success" });
    try {
      await fetch(`${API}/cursos/${curso.id}/concluir`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
    } catch {}

    setCursos((prev) =>
      prev.map((c) =>
        c.id === curso.id
          ? {
              ...c,
              concluido: true,
              concluidoEm: new Date().toISOString(),
            }
          : c
      )
    );

    setAlert({
      msg: `Curso "${curso.titulo}" concluído!`,
      type: "success",
    });
  };

  const desmarcarCurso = async (curso: Curso) => {
    setAlert({ msg: "", type: "success" });
    try {
      await fetch(`${API}/cursos/${curso.id}/desmarcar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
    } catch {}

    setCursos((prev) =>
      prev.map((c) =>
        c.id === curso.id
          ? {
              ...c,
              concluido: false,
              concluidoEm: undefined,
            }
          : c
      )
    );

    setAlert({
      msg: `Curso "${curso.titulo}" movido para pendentes.`,
      type: "success",
    });
  };

  const pendentes = cursos.filter((c) => !c.concluido);
  const concluidos = cursos.filter((c) => c.concluido);
  const lista = aba === "pendentes" ? pendentes : concluidos;

  const progresso = cursos.length
    ? Math.round((concluidos.length / cursos.length) * 100)
    : 0;

  // Função auxiliar para calcular o status do prazo
  const renderPrazo = (dateStr?: string) => {
    if (!dateStr) return null;
    
    const limite = new Date(dateStr + "T23:59:59");
    const hoje = new Date();
    
    // Zera horas para comparação justa de dias
    limite.setHours(0,0,0,0);
    hoje.setHours(0,0,0,0);

    const diffTime = limite.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-lg">
          ⚠️ Atrasado (prazo expirou em {new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR")})
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg">
          ⏰ Termina HOJE!
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg">
          🗓️ Terminar até: {new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR")} ({diffDays} dias restantes)
        </span>
      );
    }
  };

  return (
    <PageShell>
      <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-5 sm:py-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto mb-6">
          <Logo />
          <BackButton />
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-4 sm:p-7 rounded-3xl border border-border/60 shadow-sm">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-7">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center overflow-hidden shrink-0">
                  <img
                    src={docsIllus}
                    alt=""
                    loading="lazy"
                    className="w-9 sm:w-11 opacity-90"
                  />
                </div>

                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Meus Cursos
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Acompanhe seus treinamentos e progresso.
                  </p>
                </div>
              </div>

              {/* Progresso */}
              <div className="w-full sm:w-[210px] rounded-2xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                  <span className="text-lg font-bold text-primary">{progresso}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progresso}%` }} />
                </div>
              </div>
            </div>

            {/* Abas Alternadoras */}
            <div className="flex gap-2 p-1 bg-secondary/60 rounded-xl mb-6">
              <button
                onClick={() => setAba("pendentes")}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition ${
                  aba === "pendentes" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Pendentes ({pendentes.length})
              </button>
              <button
                onClick={() => setAba("concluidos")}
                className={`flex-1 h-10 rounded-lg text-sm font-semibold transition ${
                  aba === "concluidos" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Concluídos ({concluidos.length})
              </button>
            </div>

            {alert.msg && (
              <div className="mb-6">
                <Alert type={alert.type} msg={alert.msg} />
              </div>
            )}

            {/* Listagem dos Cursos */}
            <div className="space-y-4">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-10">Carregando seus cursos...</p>
              ) : lista.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">Nenhum curso nesta aba.</p>
              ) : (
                lista.map((curso) => (
                  <div key={curso.id} className="p-5 border border-border rounded-2xl bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/20 transition">
                    <div className="space-y-1 max-w-xl">
                      <h3 className="font-bold text-base text-foreground">{curso.titulo}</h3>
                      {curso.descricao && <p className="text-sm text-muted-foreground">{curso.descricao}</p>}
                      
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {curso.cargaHoraria && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded-md font-medium text-muted-foreground">
                            {curso.cargaHoraria} horas
                          </span>
                        )}
                        
                        {/* Render do Prazo Limite */}
                        {!curso.concluido && renderPrazo(curso.data_limite)}
                        
                        {curso.concluido && curso.concluidoEm && (
                          <span className="text-xs text-emerald-600 font-medium">
                            ✓ Concluído em {new Date(curso.concluidoEm).toLocaleDateString("pt-BR")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {curso.concluido ? (
                        <button
                          onClick={() => desmarcarCurso(curso)}
                          className="w-full sm:w-auto h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition"
                        >
                          Refazer curso
                        </button>
                      ) : (
                        <button
                          onClick={() => concluirCurso(curso)}
                          className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition"
                        >
                          Marcar como Concluído
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}