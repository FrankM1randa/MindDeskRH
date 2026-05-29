import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  API,
  TENANT_ID,
  authHeaders,
  useRequireAuth,
  PageShell,
  Card,
  BackButton,
  Logo,
  Alert,
} from "@/components/minddesk";
import docsIllus from "@/assets/illus-docs.png";

export const Route = createFileRoute("/documentos")({
  component: DocumentosPage,
});

// ─── Types ───────────────────────────────────────────────────────────────────

type Doc = {
  id: number;
  nome?: string;
  filename?: string;
  url?: string;
  created_at?: string;
};

type CursoAgrupado = {
  id: number;
  titulo: string;
  link: string;
  descricao?: string;
  created_at?: string;
  usuarios_atribuidos: { id: string; nome: string; cargo: string }[];
};

type Funcionario = {
  id: string;
  nome: string;
  cargo?: string;
};

type AlertState = { msg: string; type: "error" | "success" };

function getAuthUser(): { id: string; role: string } | null {
  try {
    const raw = localStorage.getItem("minddesk_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─── Page Gerenciadora ────────────────────────────────────────────────────────

function DocumentosPage() {
  useRequireAuth("admin");

  const [tab, setTab] = useState<"docs" | "cursos">("docs");
  const [alert, setAlert] = useState<AlertState>({ msg: "", type: "success" });

  const showAlert = (msg: string, type: AlertState["type"] = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert({ msg: "", type: "success" }), 4000);
  };

  return (
    <PageShell>
      <div className="min-h-screen px-4 sm:px-6 lg:px-10 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6 max-w-5xl mx-auto">
          <Logo />
          <BackButton />
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-4 sm:p-8 min-h-[520px]">
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <img src={docsIllus} alt="" loading="lazy" className="h-12 w-auto sm:h-20 flex-shrink-0" />
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold tracking-tight leading-tight">
                  Documentos & Cursos
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Gerencie PDFs da base RAG e o catálogo de cursos da equipe.
                </p>
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-secondary rounded-xl mb-5">
              <TabBtn active={tab === "docs"} onClick={() => setTab("docs")}>
                📄 <span className="hidden xs:inline">Documentos</span><span className="xs:hidden">Docs</span>
              </TabBtn>
              <TabBtn active={tab === "cursos"} onClick={() => setTab("cursos")}>
                🎓 Cursos
              </TabBtn>
            </div>

            {alert.msg && <div className="mb-4"><Alert type={alert.type} msg={alert.msg} /></div>}

            {tab === "docs" && <DocsTab showAlert={showAlert} />}
            {tab === "cursos" && <CursosTab showAlert={showAlert} />}
          </Card>
        </div>
      </div>

      <style>{`
        .md-input {
          width: 100%;
          padding: .6rem .85rem;
          border: 1.5px solid var(--color-border);
          border-radius: .6rem;
          background: var(--color-card);
          font-family: inherit;
          font-size: .9rem;
          color: inherit;
        }
        .md-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px oklch(0.5 0.18 255 / 0.12);
        }
        @media (max-width: 400px) {
          .xs\\:inline { display: inline; }
          .xs\\:hidden { display: none; }
        }
      `}</style>
    </PageShell>
  );
}

// ─── Docs Tab (RESTAURADA E IMPLEMENTADA) ───────────────────────────────────

function DocsTab({ showAlert }: { showAlert: (msg: string, type?: AlertState["type"]) => void; }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/pdfs?tenant_id=${TENANT_ID}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch {
      showAlert("Erro ao carregar os documentos da base.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      return showAlert("Apenas arquivos PDF são permitidos.", "error");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("tenant_id", String(TENANT_ID));

    // Remove Content-Type automático para o FormData se comportar corretamente
    const headers = authHeaders() as Record<string, string>;
    delete headers["Content-Type"];

    try {
      const res = await fetch(`${API}/pdfs/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) throw new Error();
      showAlert("Documento enviado e indexado na base RAG!", "success");
      fetchDocs();
    } catch {
      showAlert("Erro ao enviar o documento.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (doc: Doc) => {
    if (!window.confirm(`Tem certeza que deseja apagar o documento "${doc.filename || doc.nome}" da base de conhecimento?`)) return;

    try {
      const res = await fetch(`${API}/pdfs/${doc.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      showAlert("Documento removido com sucesso.", "success");
      fetchDocs();
    } catch {
      showAlert("Erro ao remover documento.", "error");
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Zona de Upload */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors flex flex-col items-center justify-center min-h-[180px] ${
          dragActive ? "border-primary bg-primary/5" : "border-border bg-secondary/20"
        }`}
      >
        <span className="text-3xl mb-2">📁</span>
        <h3 className="text-sm font-semibold mb-1">
          {uploading ? "Enviando e processando PDF..." : "Arraste seu arquivo PDF aqui"}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          O arquivo será quebrado em blocos e indexado pelo assistente virtual.
        </p>
        
        {!uploading && (
          <label className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-semibold hover:bg-secondary cursor-pointer transition-colors shadow-sm">
            Selecionar Arquivo
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUploadFile(f);
              }}
            />
          </label>
        )}
      </div>

      {/* Tabela/Lista de Documentos na Base */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Documentos na Base de Conhecimento (RAG)
        </h3>

        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {loading ? (
            <p className="text-center py-8 text-sm text-muted-foreground">Carregando documentos...</p>
          ) : docs.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground italic">Nenhum documento adicionado à base.</p>
          ) : (
            <div className="divide-y divide-border">
              {docs.map((doc) => (
                <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">📄</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {doc.filename || doc.nome || `Documento #${doc.id}`}
                      </p>
                      {doc.created_at && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Adicionado em {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {doc.url && (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 text-xs font-medium text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors"
                      >
                        Visualizar
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteDoc(doc)}
                      className="p-2 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cursos Tab (Híbrida e Agrupada) ───────────────────────────────

function CursosTab({ showAlert }: { showAlert: (msg: string, type?: AlertState["type"]) => void; }) {
  const [cursos, setCursos] = useState<CursoAgrupado[]>([]);
  const [loading, setLoading] = useState(true);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  
  const [form, setForm] = useState({ titulo: "", link: "", descricao: "" });
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<"link" | "pdf">("link");
  const [sending, setSending] = useState(false);

  const [cursoAtribuindo, setCursoAtribuindo] = useState<number | null>(null);
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>([]);

  useEffect(() => { 
    fetchCursos(); 
    fetchFuncionarios();
  }, []);

  const fetchCursos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cursos/todos?tenant_id=${TENANT_ID}`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      const agrupados: Record<string, CursoAgrupado> = {};
      
      data.forEach((c: any) => {
        const key = c.link;
        if (!agrupados[key]) {
            agrupados[key] = {
                id: c.id,
                titulo: c.titulo,
                link: c.link,
                descricao: c.descricao,
                created_at: c.created_at,
                usuarios_atribuidos: []
            };
        }
        if (c.usuarios) {
            agrupados[key].usuarios_atribuidos.push({
                id: c.usuario_id,
                nome: c.usuarios.nome,
                cargo: c.usuarios.cargo
            });
        }
      });

      setCursos(Object.values(agrupados));
    } catch {
      showAlert("Erro ao carregar catálogo de cursos.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchFuncionarios = async () => {
    try {
      const res = await fetch(`${API}/usuarios?tenant_id=${TENANT_ID}`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setFuncionarios(Array.isArray(data) ? data : []);
      }
    } catch (err) {}
  };

  const uploadPdfToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("arquivo", file);
    formData.append("tenant_id", String(TENANT_ID));

    const headers = authHeaders() as Record<string, string>;
    delete headers["Content-Type"];

    const res = await fetch(`${API}/pdfs/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    return data.url;
  };

  const handleCriarCurso = async () => {
    if (!form.titulo) return showAlert("Preencha o nome do curso.", "error");
    if (uploadMode === "link" && !form.link) return showAlert("Insira o link externo.", "error");
    if (uploadMode === "pdf" && !courseFile) return showAlert("Selecione um PDF.", "error");

    setSending(true);
    try {
      let finalLink = form.link;
      if (uploadMode === "pdf" && courseFile) {
        showAlert("Fazendo upload do PDF...", "success");
        finalLink = await uploadPdfToStorage(courseFile);
      }

      const res = await fetch(`${API}/cursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          usuarios_ids: [],
          titulo: form.titulo,
          link: finalLink,
          descricao: form.descricao || null,
        }),
      });

      if (!res.ok) throw new Error();
      showAlert("Curso adicionado ao catálogo!", "success");
      setForm({ titulo: "", link: "", descricao: "" });
      setCourseFile(null);
      fetchCursos();
    } catch {
      showAlert("Erro ao cadastrar curso.", "error");
    } finally {
      setSending(false);
    }
  };

  const handleAtribuirCurso = async (curso: CursoAgrupado) => {
    if (funcionariosSelecionados.length === 0) return showAlert("Selecione alguém.", "error");

    try {
      const res = await fetch(`${API}/cursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          usuarios_ids: funcionariosSelecionados,
          titulo: curso.titulo,
          link: curso.link,
          descricao: curso.descricao || null,
        }),
      });

      if (!res.ok) throw new Error();
      showAlert("Curso compartilhado com sucesso!", "success");
      setCursoAtribuindo(null);
      setFuncionariosSelecionados([]);
      fetchCursos();
    } catch {
      showAlert("Erro ao compartilhar curso.", "error");
    }
  };

  const handleDelete = async (curso: CursoAgrupado) => {
    if (!window.confirm(`Isso apagará o curso "${curso.titulo}" para TODOS os colaboradores. Tem certeza?`)) return;
    try {
      const res = await fetch(`${API}/cursos/${curso.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      showAlert("Curso removido do sistema.", "success");
      fetchCursos();
    } catch {
      showAlert("Erro ao remover curso.", "error");
    }
  };

  return (
    <>
      <div className="bg-secondary/60 border-[1.5px] border-border rounded-2xl p-4 sm:p-6 mb-8">
        <h2 className="text-sm sm:text-base font-semibold mb-4 text-primary">
          ➕ Adicionar Curso ao Catálogo
        </h2>
        
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome do curso *</label>
            <input className="md-input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Descrição</label>
            <input className="md-input" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo de conteúdo</label>
            <div className="flex gap-2 p-1 bg-card border border-border rounded-lg max-w-xs">
              <button onClick={() => setUploadMode("link")} className={`flex-1 py-1 text-xs font-medium rounded-md ${uploadMode === "link" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>🔗 Link</button>
              <button onClick={() => setUploadMode("pdf")} className={`flex-1 py-1 text-xs font-medium rounded-md ${uploadMode === "pdf" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>📄 Arquivo PDF</button>
            </div>
          </div>

          {uploadMode === "link" ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">URL do Curso *</label>
              <input className="md-input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Arquivo *</label>
              <input type="file" accept=".pdf" onChange={(e) => { const f = e.target.files?.[0]; if(f) setCourseFile(f); }} />
            </div>
          )}
        </div>
        
        <button onClick={handleCriarCurso} disabled={sending || !form.titulo} className="w-full mt-4 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-opacity">
          {sending ? "Salvando na Biblioteca..." : "Salvar no Catálogo"}
        </button>
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Catálogo & Colaboradores Vinculados
      </h3>

      <div className="flex flex-col gap-4">
        {loading && <p className="text-center py-6 text-sm">Carregando catálogo...</p>}
        {!loading && cursos.length === 0 && <p className="text-center py-6 text-sm text-muted-foreground">Nenhum curso cadastrado ainda.</p>}
        
        {cursos.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <a href={c.link} target="_blank" rel="noreferrer" className="text-base font-bold text-primary hover:underline">
                🎓 {c.titulo}
              </a>
              <button onClick={() => handleDelete(c)} className="text-destructive text-xs font-medium hover:underline px-2 py-1 bg-destructive/10 rounded-md">
                Excluir Catálogo
              </button>
            </div>
            
            {c.descricao && <p className="text-sm text-muted-foreground mb-4">{c.descricao}</p>}

            <div className="bg-secondary/40 p-3 rounded-lg border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Acesso liberado para:</p>
              
              <div className="flex flex-wrap items-center gap-2">
                {c.usuarios_atribuidos.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Ninguém vinculado ainda.</span>
                ) : (
                  c.usuarios_atribuidos.map((u, i) => (
                    <span key={i} className="px-2.5 py-1 bg-yellow-500/15 text-yellow-700 border border-yellow-500/30 rounded-full text-xs font-medium flex items-center gap-1">
                      👤 {u.nome}
                    </span>
                  ))
                )}
                
                <button 
                  onClick={() => setCursoAtribuindo(cursoAtribuindo === c.id ? null : c.id)}
                  className="px-2 py-1 bg-card border border-border rounded-full text-xs font-medium hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {cursoAtribuindo === c.id ? "Cancelar" : "➕ Compartilhar"}
                </button>
              </div>

              {cursoAtribuindo === c.id && (
                <div className="mt-4 pt-4 border-t border-border/60 animate-in fade-in slide-in-from-top-2">
                  <label className="text-xs font-medium text-foreground mb-2 block">
                    Selecione os funcionários para receber este curso:
                  </label>
                  <select 
                    multiple 
                    className="md-input min-h-[100px] mb-2"
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, opt => opt.value);
                      setFuncionariosSelecionados(values);
                    }}
                  >
                    {funcionarios.map(f => (
                      <option key={f.id} value={f.id}>{f.nome} - {f.cargo}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mb-3">Segure CTRL (Windows) ou CMD (Mac) para selecionar vários.</p>
                  
                  <button 
                    onClick={() => handleAtribuirCurso(c)}
                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90"
                  >
                    Confirmar Acesso
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all text-center ${
        active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}