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
      setCursos([
        {
          id: 1,
          titulo: "Compliance e Ética",
          descricao: "Princípios de conduta corporativa.",
          cargaHoraria: 4,
          concluido: false,
        },
        {
          id: 2,
          titulo: "Segurança no Trabalho",
          descricao: "NRs essenciais e prevenção de acidentes.",
          cargaHoraria: 6,
          concluido: false,
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
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
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
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
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

              {/* progresso */}
              <div className="w-full sm:w-[210px] rounded-2xl border border-border bg-secondary/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Progresso
                  </span>

                  <span className="text-lg font-bold text-primary">
                    {progresso}%
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${progresso}%` }}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground mt-2">
                  {concluidos.length} de {cursos.length} concluídos
                </p>
              </div>
            </div>

            {/* ALERT */}
            {alert.msg && (
              <div className="mb-5">
                <Alert type={alert.type} msg={alert.msg} />
              </div>
            )}

            {/* TABS */}
            <div className="flex bg-secondary/60 border border-border rounded-2xl p-1 mb-6 overflow-hidden">
              <button
                onClick={() => setAba("pendentes")}
                className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${
                  aba === "pendentes"
                    ? "bg-card shadow-sm text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Pendentes ({pendentes.length})
              </button>

              <button
                onClick={() => setAba("concluidos")}
                className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-all ${
                  aba === "concluidos"
                    ? "bg-card shadow-sm text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Concluídos ({concluidos.length})
              </button>
            </div>

            {/* LISTA */}
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-10 h-10 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />

                <p className="text-sm text-muted-foreground">
                  Carregando cursos...
                </p>
              </div>
            ) : lista.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border rounded-3xl bg-secondary/20">
                <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto mb-4" />

                <h3 className="text-sm font-semibold mb-1">
                  Nenhum curso encontrado
                </h3>

                <p className="text-xs text-muted-foreground">
                  {aba === "pendentes"
                    ? "Você não possui cursos pendentes."
                    : "Você ainda não concluiu nenhum curso."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {lista.map((c) => (
                  <div
                    key={c.id}
                    className="group rounded-3xl border border-border bg-card p-5 transition-all hover:border-primary/20 hover:shadow-md"
                  >
                    {/* topo */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={`w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center border ${
                          c.concluido
                            ? "bg-emerald-500/10 border-emerald-500/20"
                            : "bg-primary/10 border-primary/15"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full ${
                            c.concluido
                              ? "bg-emerald-500"
                              : "bg-primary"
                          }`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] sm:text-base font-semibold leading-tight text-foreground">
                          {c.titulo}
                        </h3>

                        {c.descricao && (
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                            {c.descricao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* infos */}
                    <div className="flex items-center justify-between gap-3 mb-5">
                      {c.cargaHoraria ? (
                        <div className="px-3 py-1.5 rounded-full bg-secondary text-[11px] font-medium text-muted-foreground">
                          {c.cargaHoraria}h de conteúdo
                        </div>
                      ) : (
                        <div />
                      )}

                      {c.concluido && c.concluidoEm && (
                        <span className="text-[11px] text-emerald-600 font-medium">
                          {new Date(c.concluidoEm).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>

                    {/* ação */}
                    <div className="mt-auto">
                      {c.concluido ? (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-semibold">
                            Concluído
                          </div>

                          <button
                            onClick={() => desmarcarCurso(c)}
                            className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                          >
                            Desmarcar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => concluirCurso(c)}
                          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.99] transition-all"
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