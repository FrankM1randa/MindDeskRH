import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  getToken,
  PageShell,
  BackButton,
  Logo,
} from "@/components/minddesk";

import {
  QrCode,
  RefreshCcw,
} from "lucide-react";

export const Route = createFileRoute("/qrcode")({
  component: QRCodePage,
});

function QRCodePage() {
  const navigate = useNavigate();

  const [qrValue] = useState("https://minddesk.app");
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    if (!getToken()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const src = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    qrValue
  )}&color=0f172a&bgcolor=FFFFFF&margin=10&_=${timestamp}`;

  return (
    <PageShell>
      <div className="min-h-screen px-4 sm:px-6 py-6 sm:py-8 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.10),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_35%)]">

        <div className="max-w-5xl mx-auto">

          {/* HEADER */}
          <header className="flex items-center justify-between mb-8">
            <Logo />
            <BackButton />
          </header>

          <div className="max-w-[430px] mx-auto">

            <div className="rounded-[32px] border border-black/5 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 sm:p-6 shadow-sm">

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center text-primary">
                  <QrCode size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    QR Code
                  </h2>

                  <p className="text-sm text-zinc-500 dark:text-white/50">
                    Escaneie para acessar
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] bg-zinc-100 dark:bg-white/[0.04] border border-black/5 dark:border-white/10 p-5 sm:p-6 flex items-center justify-center">

                <div className="bg-white rounded-[28px] p-4 shadow-lg">
                  <img
                    src={src}
                    alt="QR Code"
                    width={300}
                    height={300}
                    className="rounded-2xl"
                  />
                </div>

              </div>

              <button
                onClick={() => setTimestamp(Date.now())}
                className="mt-5 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
              >
                <RefreshCcw size={18} />
                Gerar Novo QR Code
              </button>

            </div>

          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default QRCodePage;