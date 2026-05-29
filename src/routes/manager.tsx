import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  PageShell,
  Card,
  Logo,
  getPayload,
  TOKEN_KEY,
  API,
  authHeaders,
} from "@/components/minddesk";

import homeIllus from "@/assets/illus-home.png";

export const Route = createFileRoute("/manager")({
  component: ManagerPage,
});

type MenuItem = {
  icon: string;
  title: string | ((isAdmin: boolean) => string);
  desc: string | ((isAdmin: boolean) => string);
  to:
    | "/chat"
    | "/funcionarios"
    | "/documentos"
    | "/cursos"
    | "/qrcode"
    | "/relatorios"
    | "/humanograma"
    | "/configuracoes";
  admin?: boolean;
  hideForAdmin?: boolean; 
};

type Aviso = {
  tipo: string;
  prioridade: "critica" | "alta" | "media" | "baixa";
  status?: string;
  nome?: string;
  cargo?: string;
  mensagem: string;
  dias_restantes?: number;
  meses_referencia?: number;
  data_vencimento?: string;
};

type Payload = {
  email?: string;
  nome?: string;
  role?: string;
  user_metadata?: {
    nome?: string;
  };
};

// ─── MENU CORRIGIDO E SEM DUPLICADOS ─────────────────────────────────────────
const MENU: MenuItem[] = [
  {
    icon: "💬",
    title: "Chat RH",
    desc: "Converse com o assistente virtual",
    to: "/chat",
  },
  {
    icon: "📱",
    title: "Gerar QR Code",
    desc: "Gere QR codes para o acesso rápido",
    to: "/qrcode",
  },
  {
    icon: "📊",
    title: "Relatórios",
    desc: "Faltas, atrasos, férias e mais",
    to: "/relatorios",
    admin: true,
  },
  {
    icon: "🧬",
    title: "Humanograma",
    desc: "Indicadores e análise de pessoas",
    to: "/humanograma",
    admin: true,
  },
  {
    icon: "👥",
    title: "Funcionários",
    desc: "Gerenciar colaboradores",
    to: "/funcionarios",
    admin: true,
  },
  {
    icon: "🎓",
    title: "Meus Cursos",
    desc: "Treinamentos obrigatórios e links",
    to: "/cursos",
    hideForAdmin: true, // Apenas funcionários comuns visualizam esse botão
  },
  {
    icon: "📄",
    title: "Documentos & Cursos",
    desc: "PDFs, RAG e links de treinamento",
    to: "/documentos", 
    admin: true, // Apenas administradores/gerentes acessam essa área global
  },
  {
    icon: "⚙️",
    title: "Configurações",
    desc: "Preferências da sua conta",
    to: "/configuracoes",
  },
];

// =========================================
// ESTILOS POR PRIORIDADE
// =========================================
function getAvisoStyles(prioridade: string) {
  switch (prioridade) {
    case "critica":
      return {
        card: "bg-red-600/15 border-red-600/30",
        badge: "text-red-700 bg-red-100",
        text: "text-red-700",
        icon: "🚨",
      };
    case "alta":
      return {
        card: "bg-orange-500/10 border-orange-500/20",
        badge: "text-orange-700 bg-orange-100",
        text: "text-orange-700",
        icon: "⚠️",
      };
    case "media":
      return {
        card: "bg-yellow-500/10 border-yellow-500/20",
        badge: "text-yellow-700 bg-yellow-100",
        text: "text-yellow-700",
        icon: "📅",
      };
    default:
      return {
        card: "bg-blue-500/10 border-blue-500/20",
        badge: "text-blue-700 bg-blue-100",
        text: "text-blue-700",
        icon: "ℹ️",
      };
  }
}

function getPrioridadeLabel(prioridade: string) {
  switch (prioridade) {
    case "critica": return "Crítico";
    case "alta":    return "Urgente";
    case "media":   return "Atenção";
    default:        return "Informativo";
  }
}

function getTipoLabel(tipo: string) {
  switch (tipo) {
    case "férias":      return "Férias";
    case "afastamento": return "Afastamento";
    default:            return tipo;
  }
}

// =========================================
// CARD DE AVISO — GERENTE
// =========================================
function AvisoCardGerente({ aviso }: { aviso: Aviso }) {
  const styles = getAvisoStyles(aviso.prioridade);

  return (
    <li className={`p-3 rounded-xl border ${styles.card}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${styles.badge}`}
        >
          {styles.icon} {getTipoLabel(aviso.tipo)} • {getPrioridadeLabel(aviso.prioridade)}
        </span>

        {(aviso.dias_restantes ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {aviso.dias_restantes} dia(s)
          </span>
        )}

        {aviso.data_vencimento && aviso.tipo === "férias" && (
          <span className="text-[10px] text-muted-foreground">
            Vence {aviso.data_vencimento.split("-").reverse().join("/")}
          </span>
        )}
      </div>

      <p className={`text-sm font-medium mt-2 ${styles.text}`}>
        {aviso.mensagem}
      </p>

      {(aviso.nome || aviso.cargo) && (
        <p className="text-xs text-muted-foreground mt-1">
          {aviso.nome} • {aviso.cargo}
        </p>
      )}
    </li>
  );
}

// =========================================
// CARD DE AVISO — FUNCIONÁRIO
// =========================================
function AvisoCardFuncionario({ aviso }: { aviso: Aviso }) {
  const styles = getAvisoStyles(aviso.prioridade);

  return (
    <li className={`p-4 rounded-xl border ${styles.card}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{styles.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles.badge}`}
            >
              {getTipoLabel(aviso.tipo)} • {getPrioridadeLabel(aviso.prioridade)}
            </span>

            {(aviso.dias_restantes ?? 0) > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {aviso.dias_restantes} dia(s) restante(s)
              </span>
            )}
          </div>

          <p className={`text-sm font-medium leading-snug ${styles.text}`}>
            {aviso.mensagem}
          </p>

          {aviso.data_vencimento && aviso.tipo === "férias" && (
            <p className="text-xs text-muted-foreground mt-1">
              Vencimento: {aviso.data_vencimento.split("-").reverse().join("/")}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

// =========================================
// PÁGINA PRINCIPAL
// =========================================
function ManagerPage() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("usuário");
  const [isAdmin, setIsAdmin] = useState(false);
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    const p = getPayload() as Payload;

    if (!p) {
      navigate({ to: "/login" });
      return;
    }

    const admin = p.role === "admin";

    setNome(
      p.nome ||
        p.user_metadata?.nome ||
        p.email?.split("@")[0] ||
        "usuário"
    );

    setIsAdmin(admin);
    fetchAvisos(admin);
  }, [navigate]);

  const fetchAvisos = async (admin: boolean) => {
    try {
      const url = admin
        ? `${API}/avisos`
        : `${API}/avisos/meus`;

      const res = await fetch(url, {
        headers: authHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        return;
      }

      setAvisos(data);
    } catch (err) {
      console.error("Erro ao buscar avisos", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate({ to: "/login" });
  };

  const items = useMemo(() => {
    return MENU.filter((item) => {
      if (item.admin && !isAdmin) return false;
      if (item.hideForAdmin && isAdmin) return false; 
      return true;
    });
  }, [isAdmin]);

  return (
    <PageShell>
      <div className="min-h-screen px-6 lg:px-12 py-10">

        <header className="flex items-center justify-between mb-10">
          <Logo />

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">
              Olá,{" "}
              <span className="text-foreground font-semibold capitalize">
                {nome}
              </span>

              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-accent/15 text-accent rounded-full">
                  Gerente
                </span>
              )}
            </span>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-sm font-medium border border-border rounded-lg hover:bg-secondary hover:text-primary hover:border-primary/40 transition-colors"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[1fr_360px] gap-10 max-w-6xl mx-auto">

          {/* LADO ESQUERDO */}
          <div>
            <Card className="p-8 mb-6">
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
                    Painel inicial
                  </p>

                  <h1 className="text-3xl font-semibold tracking-tight mb-2">
                    Bem-vindo de volta,{" "}
                    <span className="capitalize">{nome}</span>
                  </h1>

                  <p className="text-muted-foreground text-sm max-w-md">
                    {isAdmin
                      ? "Acesse o assistente de RH, gere QR codes, consulte relatórios e gerencie sua equipe."
                      : "Acesse o assistente de RH, registre seu ponto e consulte seus cursos e treinamentos."}
                  </p>
                </div>

                <img
                  src={homeIllus}
                  alt=""
                  width={220}
                  height={180}
                  className="hidden md:block w-44 h-auto -mt-4"
                />
              </div>
            </Card>

            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Menu
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((m) => {
                const resolvedTitle = typeof m.title === "function" ? m.title(isAdmin) : m.title;
                const resolvedDesc = typeof m.desc === "function" ? m.desc(isAdmin) : m.desc;

                return (
                  <Link key={resolvedTitle} to={m.to}>
                    <div className="flex items-center gap-3.5 p-4 border-[1.5px] rounded-2xl bg-card transition-all border-border hover:border-primary hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
                      <div className="w-11 h-11 grid place-items-center rounded-xl bg-secondary text-xl flex-shrink-0">
                        {m.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold leading-tight">
                          {resolvedTitle}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {resolvedDesc}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* LADO DIREITO — MURAL */}
          <aside>
            <Card className="p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {isAdmin ? "Mural de avisos" : "Meus avisos"}
              </h3>

              {!isAdmin && (
                <p className="text-xs text-muted-foreground mb-3">
                  Situação das suas férias e afastamentos
                </p>
              )}

              {isAdmin && (
                <p className="text-xs text-muted-foreground mb-3">
                  Alertas da sua equipe
                </p>
              )}

              <ul className="space-y-3">
                {avisos.length === 0 && (
                  <li className="text-sm text-muted-foreground py-6 text-center">
                    {isAdmin
                      ? "Nenhum aviso para a equipe."
                      : "Você não tem avisos pendentes. Tudo em ordem! ✅"}
                  </li>
                )}

                {avisos.map((a, index) =>
                  isAdmin ? (
                    <AvisoCardGerente key={index} aviso={a} />
                  ) : (
                    <AvisoCardFuncionario key={index} aviso={a} />
                  )
                )}
              </ul>
            </Card>
          </aside>

        </div>
      </div>
    </PageShell>
  );
}

export default ManagerPage;