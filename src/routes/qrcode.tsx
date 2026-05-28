import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getToken, PageShell, Card, BackButton, Logo } from "@/components/minddesk";

export const Route = createFileRoute("/qrcode")({
  component: QRCodePage,
});

function QRCodePage() {
  const navigate = useNavigate();
  const [qrValue] = useState("https://minddesk.app");
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const src = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(qrValue)}&color=000000&bgcolor=FFFFFF&margin=10&_=${timestamp}`;

  return (
    <PageShell>
      <div className="min-h-screen px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Logo />
          <BackButton />
        </div>

        <Card className="p-5">
          <div className="bg-secondary/60 border border-border rounded-2xl p-6 grid place-items-center mb-6">
            <img src={src} alt="QR Code" width={280} height={280} className="rounded-md" />
          </div>

          <button
            onClick={() => setTimestamp(Date.now())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 active:scale-95 transition-all"
          >
            Gerar Novo QR Code
          </button>
        </Card>
      </div>
    </PageShell>
  );
}