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
  title: string;
  desc: string;
  to:
  | "/chat"
  | "/funcionarios"
  | "/documentos"
  | "/qrcode"
  | "/relatorios"
  | "/humanograma"
  | "/configuracoes";
  admin?: boolean;
};

type Aviso = {
  tipo: string;

  prioridade: "critica" | "alta" | "media";

  nome?: string;
  cargo?: string;

  mensagem: string;

  dias_restantes?: number;

  meses_pendente?: number;
};

type Payload = {
  email?: string;
  nome?: string;
  role?: string;

  user_metadata?: {
    nome?: string;
  };
};

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
    icon: "📄",
    title: "Documentos & Cursos",
    desc: "PDFs, RAG e links de treinamento",
    to: "/documentos",
    admin: true,
  },
  {
    icon: "⚙️",
    title: "Configurações",
    desc: "Preferências da sua conta",
    to: "/configuracoes",
  },
];

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

    setNome(
      p.nome ||
      p.user_metadata?.nome ||
      p.email?.split("@")[0] ||
      "usuário"
    );

    setIsAdmin(p.role === "admin");

    fetchAvisos();
  }, [navigate]);

  const fetchAvisos = async () => {
    try {
      const res = await fetch(`${API}/avisos`, {
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

  const items = useMemo(() => MENU, []);

  function getAvisoStyles(prioridade: string) {

    switch (prioridade) {

      case "critica":
        return {
          card: "bg-red-600/15 border-red-600/30",
          badge: "text-red-700 bg-red-100",
          text: "text-red-700",
        };

      case "alta":
        return {
          card: "bg-orange-500/10 border-orange-500/20",
          badge: "text-orange-700 bg-orange-100",
          text: "text-orange-700",
        };

      default:
        return {
          card: "bg-yellow-500/10 border-yellow-500/20",
          badge: "text-yellow-700 bg-yellow-100",
          text: "text-yellow-700",
        };
    }
  }

  function getPrioridadeLabel(prioridade: string) {

    switch (prioridade) {

      case "critica":
        return "CRÍTICO";

      case "alta":
        return "ALTA";

      default:
        return "MÉDIA";
    }
  }

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

          <div>

            <Card className="p-8 mb-6">

              <div className="flex items-start gap-6">

                <div className="flex-1">

                  <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
                    Painel inicial
                  </p>

                  <h1 className="text-3xl font-semibold tracking-tight mb-2">

                    Bem-vindo de volta,{" "}

                    <span className="capitalize">
                      {nome}
                    </span>

                  </h1>

                  <p className="text-muted-foreground text-sm max-w-md">
                    Acesse o assistente de RH, gere QR codes,
                    consulte relatórios e gerencie sua equipe —
                    tudo em um só lugar.
                  </p>

                </div>

                <img
                  src={homeIllus}
                  alt=""
                  width={220}
                  height={180}
                  loading="lazy"
                  className="hidden md:block w-44 h-auto -mt-4"
                />

              </div>

            </Card>

            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Menu
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">

              {items.map((m) => {

                const locked = m.admin && !isAdmin;

                const inner = (

                  <div
                    className={`flex items-center gap-3.5 p-4 border-[1.5px] rounded-2xl bg-card transition-all ${locked
                        ? "opacity-50 cursor-not-allowed border-border"
                        : "border-border hover:border-primary hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                      }`}
                  >

                    <div className="w-11 h-11 grid place-items-center rounded-xl bg-secondary text-xl flex-shrink-0">
                      {m.icon}
                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="text-[15px] font-semibold leading-tight">
                        {m.title}
                      </div>

                      <div className="text-xs text-muted-foreground mt-0.5">
                        {m.desc}
                      </div>

                    </div>

                    {locked && (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                        Gerente
                      </span>
                    )}

                  </div>
                );

                return locked ? (
                  <div key={m.title}>
                    {inner}
                  </div>
                ) : (
                  <Link key={m.title} to={m.to}>
                    {inner}
                  </Link>
                );
              })}

            </div>

          </div>

          <aside>

            <Card className="p-6">

              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Mural de avisos
              </h3>

              <ul className="space-y-3">

                {avisos.length === 0 && (
                  <li className="text-sm text-muted-foreground">
                    Nenhum aviso disponível.
                  </li>
                )}

                {avisos.map((a, index) => {

                  const styles =
                    getAvisoStyles(a.prioridade);

                  return (

                    <li
                      key={index}
                      className={`p-3 rounded-xl border ${styles.card}`}
                    >

                      <div className="flex items-center justify-between">

                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${styles.badge}`}
                        >
                          {a.tipo} • {getPrioridadeLabel(a.prioridade)}
                        </span>

                        {(a.dias_restantes ?? 0) > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {a.dias_restantes} dia(s)
                          </span>
                        )}

                      </div>

                      <p className={`text-sm font-medium mt-2 ${styles.text}`}>
                        {a.mensagem}
                      </p>

                      {(a.nome || a.cargo) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {a.nome} • {a.cargo}
                        </p>
                      )}

                    </li>
                  );
                })}

              </ul>

            </Card>

          </aside>

        </div>

      </div>
    </PageShell>
  );
}

export default ManagerPage;