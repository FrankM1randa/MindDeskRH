import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API, authHeaders, useRequireAuth, PageShell, Card, BackButton, Logo, Alert } from "@/components/minddesk";
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
};

function CursosPage() {
  useRequireAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ msg: string; type: "error" | "success" }>({ msg: "", type: "error" });
  const [aba, setAba] = useState<"pendentes" | "concluidos">("pendentes");

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cursos`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCursos(data || []);
    } catch {
      // Fallback de exemplo caso o backend ainda não tenha o endpoint
      setCursos([
        { id: 1, titulo: "Compliance e Ética", descricao: "Princípios de conduta corporativa.", cargaHoraria: 4, concluido: false },
        { id: 2, titulo: "Segurança no Trabalho", descricao: "NRs essenciais e prevenção de acidentes.", cargaHoraria: 6, concluido: false },
        { id: 3, titulo: "LGPD para Colaboradores", descricao: "Boas práticas com dados pessoais.", cargaHoraria: 3, concluido: true, concluidoEm: new Date().toISOString() },
        { id: 4, titulo: "Comunicação Não-Violenta", descricao: "Técnicas para um ambiente saudável.", cargaHoraria: 2, concluido: true, concluidoEm: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const concluirCurso = async (curso: Curso) => {
    setAlert({ msg: "", type: "success" });
    try {
      const res = await fetch(`${API}/cursos/${curso.id}/concluir`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      if (!res.ok) throw new Error();
    } catch {
      // segue otimista mesmo sem backend
    }
    setCursos((prev) =>
      prev.map((c) => (c.id === curso.id ? { ...c, concluido: true, concluidoEm: new Date().toISOString() } : c)),
    );
    setAlert({ msg: `Curso "${curso.titulo}" concluído!`, type: "success" });
  };

  // =========================================
  // NOVA FUNÇÃO: DESMARCAR CURSO CONCLUÍDO
  // =========================================
  const desmarcarCurso = async (curso: Curso) => {
    setAlert({ msg: "", type: "success" });
    try {
      // Exemplo de rota de DELETE ou POST para reverter o status no backend
      const res = await fetch(`${API}/cursos/${curso.id}/desmarcar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
      });
      if (!res.ok) throw new Error();
    } catch {
      // segue otimista
    }
    setCursos((prev) =>
      prev.map((c) => (c.id === curso.id ? { ...c, concluido: false, concluidoEm: undefined } : c)),
    );
    setAlert({ msg: `Curso "${curso.titulo}" movido para pendentes.`, type: "success" });
  };

  const pendentes = cursos.filter((c) => !c.concluido);
  const concluidos = cursos.filter((c) => c.concluido);
  const lista = aba === "pendentes" ? pendentes : concluidos;
  const progresso = cursos.length ? Math.round((concluidos.length / cursos.length) * 100) : 0;

  return (
    <PageShell>
      <div className="min-h-screen px-6 lg:px-10 py-10">
        <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
          <Logo />
          <BackButton />
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <img src={docsIllus} alt="" width={110} height={75} loading="lazy" className="h-16 w-auto" />
              <div className="flex-1 min-w-[200px]">
                <h1 className="text-2xl font-semibold tracking-tight">Meus Cursos</h1>
                <p className="text-sm text-muted-foreground">Acompanhe seus treinamentos e marque como concluído.</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-semibold text-primary">{progresso}%</div>
                <div className="text-xs text-muted-foreground">{concluidos.length}/{cursos.length} concluídos</div>
              </div>
            </div>

            {/* progress bar */}
            <div className="w-full h-2 rounded-full bg-secondary overflow-hidden mb-6">
              <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
            </div>

            {alert.msg && (
              <div className="mb-4">
                <Alert type={alert.type} msg={alert.msg} />
              </div>
            )}

            {/* Tabs */}
            <div className="inline-flex p-1 rounded-xl bg-secondary mb-5">
              <button
                onClick={() => setAba("pendentes")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  aba === "pendentes" ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pendentes ({pendentes.length})
              </button>
              <button
                onClick={() => setAba("concluidos")}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  aba === "concluidos" ? "bg-card shadow text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Concluídos ({concluidos.length})
              </button>
            </div>

            {/* Lista */}
            {loading ? (
              <p className="text-center py-10 text-muted-foreground text-sm">Carregando cursos...</p>
            ) : lista.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {aba === "pendentes" ? "🎉 Você não tem cursos pendentes!" : "Nenhum curso concluído ainda."}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {lista.map((c) => (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border-[1.5px] border-border bg-card hover:border-primary/40 transition-colors flex flex-col"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary grid place-items-center text-lg flex-shrink-0">
                        {c.concluido ? "✅" : "📘"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[15px] font-semibold leading-tight">{c.titulo}</h3>
                        {c.descricao && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.descricao}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      {c.cargaHoraria && <span>⏱ {c.cargaHoraria}h</span>}
                      {c.concluido && c.concluidoEm && (
                        <span className="text-emerald-600 font-medium">
                          Concluído em {new Date(c.concluidoEm).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto">
                      {c.concluido ? (
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Finalizado
                          </span>
                          
                          {/* BOTÃO DESMARCAR */}
                          <button
                            onClick={() => desmarcarCurso(c)}
                            className="text-xs font-medium text-muted-foreground hover:text-red-600 underline underline-offset-2 transition-colors cursor-pointer"
                          >
                            Desmarcar conclusão
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => concluirCurso(c)}
                          className="w-full px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:-translate-y-0.5 transition-all"
                        >
                          Marcar como concluído
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export default CursosPage;