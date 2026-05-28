import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { API, TENANT_ID, authHeaders, useRequireAuth, PageShell, Card, BackButton, Logo, Alert } from "@/components/minddesk";
import docsIllus from "@/assets/illus-docs.png";

export const Route = createFileRoute("/documentos")({
  component: DocumentosPage,
});

type Doc = { id: number; nome?: string; filename?: string; created_at?: string };
type Curso = { id: number; titulo: string; link: string };

function DocumentosPage() {
  const navigate = useNavigate();
  useRequireAuth("admin");
  const [tab, setTab] = useState<"docs" | "cursos">("docs");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([
    { id: 1, titulo: "Onboarding MindDesk", link: "https://exemplo.com/curso1" },
    { id: 2, titulo: "Compliance & LGPD", link: "https://exemplo.com/curso2" },
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: "error" | "success" }>({ msg: "", type: "error" });
  const [novoCurso, setNovoCurso] = useState({ titulo: "", link: "" });

  useEffect(() => {
    fetchDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await fetch(`${API}/pdfs?tenant_id=${TENANT_ID}`, { headers: authHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : data.pdfs || []);
    } catch {
      setAlert({ msg: "Erro ao carregar documentos.", type: "error" });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setAlert({ msg: "", type: "success" });
    const body = new FormData();
    body.append("arquivo", selectedFile);
    body.append("tenant_id", String(TENANT_ID));
    try {
      const res = await fetch(`${API}/pdfs`, { method: "POST", headers: authHeaders(), body });
      if (!res.ok) throw new Error();
      setAlert({ msg: "Documento enviado!", type: "success" });
      setSelectedFile(null);
      fetchDocs();
    } catch {
      setAlert({ msg: "Falha no upload.", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (d: Doc) => {
    if (!window.confirm("Excluir documento?")) return;
    await fetch(`${API}/pdfs/${d.id}`, { method: "DELETE", headers: authHeaders() });
    fetchDocs();
  };

  const addCurso = () => {
    if (!novoCurso.titulo || !novoCurso.link) return;
    setCursos([...cursos, { id: Date.now(), ...novoCurso }]);
    setNovoCurso({ titulo: "", link: "" });
  };

  return (
    <PageShell>
      <div className="min-h-screen px-6 lg:px-10 py-10">
        <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto">
          <Logo />
          <BackButton />
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-8">
            <div className="flex flex-wrap items-center gap-4 mb-7">
              <img src={docsIllus} alt="" width={100} height={100} loading="lazy" className="h-20 w-auto" />
              <div className="flex-1 min-w-[200px]">
                <h1 className="text-2xl font-semibold tracking-tight">Documentos & Cursos</h1>
                <p className="text-sm text-muted-foreground">Envie PDFs para a base RAG e gerencie links de treinamento.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="inline-flex gap-1 p-1 bg-secondary rounded-xl mb-6">
              <TabBtn active={tab === "docs"} onClick={() => setTab("docs")}>📄 Documentos (RAG)</TabBtn>
              <TabBtn active={tab === "cursos"} onClick={() => setTab("cursos")}>🎓 Cursos</TabBtn>
            </div>

            {alert.msg && <div className="mb-4"><Alert type={alert.type} msg={alert.msg} /></div>}

            {tab === "docs" && (
              <>
                {/* Upload */}
                <div className="bg-secondary/60 border-[1.5px] border-border rounded-2xl p-6 mb-7">
                  <h2 className="text-base font-semibold mb-4 text-center">Enviar novo documento</h2>
                  <label
                    onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragActive(false);
                      if (e.dataTransfer.files?.[0]) setSelectedFile(e.dataTransfer.files[0]);
                    }}
                    className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
                      dragActive ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/60"
                    }`}
                  >
                    <span className="text-3xl">📥</span>
                    <p className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : "Arraste e solte ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX (máx 10MB)</p>
                    <input type="file" accept=".pdf,.docx" hidden onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} />
                  </label>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleUpload}
                      disabled={!selectedFile || uploading}
                      className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-50"
                    >
                      {uploading ? "Enviando…" : "Enviar"}
                    </button>
                  </div>
                </div>

                {/* List */}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Documentos armazenados
                </h3>
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-primary text-primary-foreground">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">Arquivo</th>
                        <th className="text-left px-4 py-3 font-semibold">Data</th>
                        <th className="text-right px-4 py-3 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.length === 0 && (
                        <tr><td colSpan={3} className="text-center text-muted-foreground py-10">Nenhum documento.</td></tr>
                      )}
                      {docs.map((d) => (
                        <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/50">
                          <td className="px-4 py-3 font-medium">{d.nome || d.filename || `#${d.id}`}</td>
                          <td className="px-4 py-3 text-muted-foreground">{d.created_at?.slice(0, 10) || "—"}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeleteDoc(d)} className="text-destructive text-sm font-medium hover:underline">
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {tab === "cursos" && (
              <>
                <div className="bg-secondary/60 border-[1.5px] border-border rounded-2xl p-6 mb-7">
                  <h2 className="text-base font-semibold mb-4">Adicionar link de curso</h2>
                  <div className="grid sm:grid-cols-[1fr_2fr_auto] gap-2">
                    <input className="md-input" placeholder="Título" value={novoCurso.titulo} onChange={(e) => setNovoCurso({ ...novoCurso, titulo: e.target.value })} />
                    <input className="md-input" placeholder="https://…" value={novoCurso.link} onChange={(e) => setNovoCurso({ ...novoCurso, link: e.target.value })} />
                    <button onClick={addCurso} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90">
                      Adicionar
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Cursos disponíveis
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {cursos.map((c) => (
                    <a key={c.id} href={c.link} target="_blank" rel="noreferrer" className="p-4 rounded-xl border border-border bg-card hover:border-primary hover:-translate-y-0.5 transition-all flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary grid place-items-center text-lg">🎓</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{c.titulo}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.link}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
      <style>{`
        .md-input { width:100%; padding:.6rem .9rem; border:1.5px solid var(--color-border); border-radius:.6rem; background:var(--color-card); font-family:inherit; font-size:.9rem; }
        .md-input:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 4px oklch(0.5 0.18 255 / 0.12); }
      `}</style>
    </PageShell>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
