import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  API,
  authHeaders,
  getToken,
  PageShell,
  BackButton,
  Logo,
  Alert,
} from "@/components/minddesk";

export const Route = createFileRoute("/funcionarios")({
  component: FuncionariosPage,
});

type Func = {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  nivel: string;
};

function FuncionariosPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const [list, setList] = useState<Func[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Func | null>(null);

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    password: "",
    confirmarSenha: "",
    cargo: "",
    nivel: "Funcionário",
  });

  const [alert, setAlert] = useState<{
    msg: string;
    type: "error" | "success";
  }>({
    msg: "",
    type: "error",
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const res = await fetch(`${API}/usuarios`, {
        headers: authHeaders(),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      setList(
        (data || []).map((f: any) => ({
          id: f.id,
          nome: f.nome || "",
          email: f.email || "",
          cargo: f.cargo || "Não informado",
          nivel:
            f.role === "admin"
              ? "Gerente"
              : "Funcionário",
        }))
      );
    } catch {
      setAlert({
        msg: "Não foi possível carregar a lista.",
        type: "error",
      });
    }
  };

  const filtered = list.filter((f) => {
    const q = search.toLowerCase();

    return (
      f.nome.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      f.cargo.toLowerCase().includes(q)
    );
  });

  const openNovo = () => {
    setEditing(null);

    setForm({
      nome: "",
      email: "",
      password: "",
      confirmarSenha: "",
      cargo: "",
      nivel: "Funcionário",
    });

    setAlert({
      msg: "",
      type: "error",
    });

    setShowModal(true);
  };

  const openEdit = (f: Func) => {
    setEditing(f);

    setForm({
      nome: f.nome || "",
      email: f.email || "",
      password: "",
      confirmarSenha: "",
      cargo: f.cargo || "",
      nivel: f.nivel || "Funcionário",
    });

    setAlert({
      msg: "",
      type: "error",
    });

    setShowModal(true);
  };

  const handleSave = async () => {
    if (loading) return;

    setLoading(true);

    setAlert({
      msg: "",
      type: "error",
    });

    try {
      const nome = form.nome.trim();
      const email = form.email.trim().toLowerCase();
      const cargo = form.cargo.trim();

      const role =
        form.nivel === "Gerente"
          ? "admin"
          : "viewer";

      // ===== VALIDAÇÕES =====

      if (!nome || !email || !cargo) {
        return setAlert({
          msg: "Nome, e-mail e cargo são obrigatórios.",
          type: "error",
        });
      }

      if (nome.length < 3) {
        return setAlert({
          msg: "O nome deve possuir ao menos 3 caracteres.",
          type: "error",
        });
      }

      const emailRegex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        return setAlert({
          msg: "Digite um e-mail válido.",
          type: "error",
        });
      }

      if (cargo.length < 2) {
        return setAlert({
          msg: "Cargo inválido.",
          type: "error",
        });
      }

      // ===== VALIDAÇÃO SENHA =====

      if (!editing) {
        if (!form.password) {
          return setAlert({
            msg: "Senha é obrigatória.",
            type: "error",
          });
        }

        if (form.password.length < 6) {
          return setAlert({
            msg: "A senha deve possuir no mínimo 6 caracteres.",
            type: "error",
          });
        }

        if (form.password !== form.confirmarSenha) {
          return setAlert({
            msg: "As senhas não coincidem.",
            type: "error",
          });
        }
      }

      let res: Response;

      // ===== UPDATE =====

      if (editing) {
        const payload: any = {
          nome,
          cargo,
        };

        if (email !== editing.email) {
          payload.novoEmail = email;
        }

        res = await fetch(
          `${API}/usuarios?email=${encodeURIComponent(
            editing.email
          )}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...authHeaders(),
            },
            body: JSON.stringify(payload),
          }
        );
      }

      // ===== CREATE =====

      else {
        res = await fetch(`${API}/usuarios/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({
            nome,
            email,
            password: form.password,
            cargo,
            role,
          }),
        });
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return setAlert({
          msg:
            data?.erro ||
            data?.detalhe ||
            "Erro ao salvar funcionário.",
          type: "error",
        });
      }

      setAlert({
        msg: editing
          ? "Funcionário atualizado com sucesso."
          : "Funcionário criado com sucesso.",
        type: "success",
      });

      setShowModal(false);

      setForm({
        nome: "",
        email: "",
        password: "",
        confirmarSenha: "",
        cargo: "",
        nivel: "Funcionário",
      });

      fetchAll();
    } catch {
      setAlert({
        msg: "Erro de conexão com o servidor.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (f: Func) => {
    if (!window.confirm(`Excluir ${f.nome}?`)) return;

    try {
      const res = await fetch(
        `${API}/usuarios?email=${encodeURIComponent(
          f.email
        )}`,
        {
          method: "DELETE",
          headers: authHeaders(),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return setAlert({
          msg:
            data?.erro ||
            "Erro ao excluir funcionário.",
          type: "error",
        });
      }

      fetchAll();
    } catch {
      setAlert({
        msg: "Erro de conexão.",
        type: "error",
      });
    }
  };

  return (
    <PageShell>
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <BackButton />
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Funcionários
            </h1>

            <p className="text-xs text-muted-foreground">
              Gerencie sua equipe e permissões
            </p>
          </div>

          <button
            onClick={openNovo}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-95 transition-all"
          >
            + Novo
          </button>
        </div>

        {/* PESQUISA */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base">
            🔍
          </span>

          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou cargo…"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full pl-9 pr-4 py-2.5 border-[1.5px] border-border rounded-xl text-sm bg-card focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />

          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {alert.msg && !showModal && (
          <div className="mb-4">
            <Alert
              type={alert.type}
              msg={alert.msg}
            />
          </div>
        )}

        {search && (
          <p className="text-xs text-muted-foreground mb-3">
            {filtered.length} resultado
            {filtered.length !== 1 ? "s" : ""} para "
            {search}"
          </p>
        )}

        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-16">
              {search
                ? "Nenhum funcionário encontrado."
                : "Nenhum funcionário carregado."}
            </p>
          )}

          {filtered.map((f) => (
            <div
              key={f.id}
              className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary grid place-items-center font-bold text-sm flex-shrink-0">
                {f.nome.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {f.nome}
                </p>

                <p className="text-xs text-muted-foreground truncate">
                  {f.email}
                </p>

                <p className="text-xs text-muted-foreground truncate">
                  {f.cargo}
                </p>

                <span
                  className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${f.nivel === "Gerente"
                      ? "bg-accent/15 text-accent"
                      : "bg-primary/10 text-primary"
                    }`}
                >
                  {f.nivel}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openEdit(f)}
                  className="px-3 py-1.5 text-xs font-semibold border border-primary text-primary rounded-lg active:scale-95 transition-all"
                >
                  Editar
                </button>

                <button
                  onClick={() => handleDelete(f)}
                  className="px-3 py-1.5 text-xs font-semibold border border-destructive text-destructive rounded-lg active:scale-95 transition-all"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card w-full rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />

            <h2 className="text-base font-semibold mb-1">
              {editing
                ? "Editar funcionário"
                : "Novo funcionário"}
            </h2>

            <p className="text-xs text-muted-foreground mb-4">
              Preencha os dados abaixo.
            </p>

            {alert.msg && (
              <div className="mb-3">
                <Alert
                  type={alert.type}
                  msg={alert.msg}
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <input
                className="md-input"
                placeholder="Nome"
                value={form.nome}
                maxLength={100}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nome: e.target.value,
                  })
                }
              />

              <input
                className="md-input"
                type="email"
                placeholder="E-mail"
                value={form.email}
                maxLength={150}
                autoComplete="off"
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />

              <input
                className="md-input"
                placeholder="Cargo"
                value={form.cargo}
                maxLength={80}
                onChange={(e) =>
                  setForm({
                    ...form,
                    cargo: e.target.value,
                  })
                }
              />

              {!editing && (
                <>
                  <input
                    className="md-input"
                    type="password"
                    placeholder="Senha"
                    value={form.password}
                    minLength={6}
                    autoComplete="new-password"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password: e.target.value,
                      })
                    }
                  />

                  <input
                    className="md-input"
                    type="password"
                    placeholder="Confirmar senha"
                    value={form.confirmarSenha}
                    minLength={6}
                    autoComplete="new-password"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        confirmarSenha:
                          e.target.value,
                      })
                    }
                  />
                </>
              )}

              <select
                className="md-input"
                value={form.nivel}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nivel: e.target.value,
                  })
                }
              >
                <option>Funcionário</option>
                <option>Gerente</option>
              </select>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 py-3 text-sm border border-border rounded-xl active:scale-95 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 py-3 text-sm font-semibold bg-primary text-primary-foreground rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading
                  ? "Salvando..."
                  : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .md-input {
          width: 100%;
          padding: .7rem .9rem;
          border: 1.5px solid var(--color-border);
          border-radius: .75rem;
          background: var(--color-background);
          font-family: inherit;
          font-size: .9rem;
        }

        .md-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 4px oklch(0.5 0.18 255 / 0.12);
        }
      `}</style>
    </PageShell>
  );
}

export default FuncionariosPage;