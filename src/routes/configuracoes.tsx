import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  getPayload,
  getToken,
  TOKEN_KEY,
  API,
  authHeaders,
  PageShell,
  Card,
  BackButton,
  Logo,
  Alert,
} from "@/components/minddesk";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

type Payload = {
  email?: string;
  nome?: string;
  role?: string;
  user_metadata?: {
    nome?: string;
  };
};

function ConfiguracoesPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [role, setRole] = useState("");

  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(false);

  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const [senha, setSenha] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const [alert, setAlert] = useState<{
    msg: string;
    type: "error" | "success";
  }>({
    msg: "",
    type: "error",
  });

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
      return;
    }

    const p = getPayload() as Payload;

    setEmail(p?.email || "");

    setNome(
      p?.nome ||
      p?.user_metadata?.nome ||
      p?.email?.split("@")[0] ||
      ""
    );

    role === "admin" ? "Gerente" : "Funcionário";
    setRole(p?.role || "user");
  }, [navigate]);

  const toggleDark = (val: boolean) => {
    setDarkMode(val);
    document.documentElement.classList.toggle("dark", val);
  };
const handleAlterarSenha = async () => {
    setAlert({ msg: "", type: "error" });

    if (
      !senha.senhaAtual ||
      !senha.novaSenha ||
      !senha.confirmarSenha
    ) {
      return setAlert({
        msg: "Preencha todos os campos.",
        type: "error",
      });
    }

    if (senha.novaSenha !== senha.confirmarSenha) {
      return setAlert({
        msg: "As senhas não coincidem.",
        type: "error",
      });
    }

    if (senha.novaSenha.length < 6) {
      return setAlert({
        msg: "Mínimo 6 caracteres.",
        type: "error",
      });
    }

    try {
      const res = await fetch(`${API}/auth/senha`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          senhaAtual: senha.senhaAtual,
          novaSenha: senha.novaSenha,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return setAlert({
          // Garante que vai ler a propriedade 'error' retornada pelo backend
          msg: data.error || data.mensagem || "Erro ao alterar senha.",
          type: "error",
        });
      }

      setAlert({
        msg: "Senha alteredada com sucesso!",
        type: "success",
      });

      setSenha({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });
    } catch {
      setAlert({
        msg: "Erro de conexão com o servidor.",
        type: "error",
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate({ to: "/login" });
  };

  return (
    <PageShell>
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <BackButton />
        </div>

        <div className="space-y-4">

          {/* Conta */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Conta
            </h2>

            <Row label="Nome">
              <span className="text-sm font-medium capitalize">
                {nome || "—"}
              </span>
            </Row>

            <Row label="E-mail">
              <span className="text-sm text-muted-foreground">
                {email || "—"}
              </span>
            </Row>

            <Row label="Nível">
              <span
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${role === "admin"
                    ? "bg-accent/15 text-accent"
                    : "bg-primary/10 text-primary"
                  }`}
              >
                {role === "admin" ? "Gerente" : "Funcionário"}
              </span>
            </Row>
          </Card>

          {/* Alterar senha */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Alterar senha
            </h2>

            {alert.msg && (
              <div className="mb-3">
                <Alert type={alert.type} msg={alert.msg} />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <input
                className="md-input"
                type="password"
                placeholder="Senha atual"
                value={senha.senhaAtual}
                onChange={(e) =>
                  setSenha({
                    ...senha,
                    senhaAtual: e.target.value,
                  })
                }
              />

              <input
                className="md-input"
                type="password"
                placeholder="Nova senha"
                value={senha.novaSenha}
                onChange={(e) =>
                  setSenha({
                    ...senha,
                    novaSenha: e.target.value,
                  })
                }
              />

              <input
                className="md-input"
                type="password"
                placeholder="Confirmar nova senha"
                value={senha.confirmarSenha}
                onChange={(e) =>
                  setSenha({
                    ...senha,
                    confirmarSenha: e.target.value,
                  })
                }
              />

              <button
                onClick={handleAlterarSenha}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm active:scale-95 transition-all"
              >
                Salvar nova senha
              </button>
            </div>
          </Card>

          {/* Notificações */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Notificações
            </h2>

            <Toggle
              label="Notificações por e-mail"
              checked={notifEmail}
              onChange={setNotifEmail}
            />

            <Toggle
              label="Notificações push"
              checked={notifPush}
              onChange={setNotifPush}
            />
          </Card>

          {/* Aparência */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Aparência
            </h2>

            <Toggle
              label="Tema escuro"
              checked={darkMode}
              onChange={toggleDark}
            />
          </Card>

          {/* Sessão */}
          <Card className="p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Sessão
            </h2>

            <button
              onClick={handleLogout}
              className="w-full py-3 bg-destructive/10 text-destructive border border-destructive/30 rounded-xl font-semibold text-sm active:scale-95 transition-all"
            >
              Sair da conta
            </button>
          </Card>

        </div>
      </div>

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

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>

      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between py-3 border-b border-border last:border-0 cursor-pointer">
      <span className="text-sm">{label}</span>

      <span
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"
          }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""
            }`}
        />
      </span>
    </label>
  );
}