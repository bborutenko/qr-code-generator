import Link from "next/link";
import { getQRCodeAnalytics, getQRCode } from "@/services/hovercode";
import AnalyticsClient from "./components";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ qr_id: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { qr_id } = await params;
  const { qrData, dynamic } = await searchParams;

  const backParams = new URLSearchParams();
  if (qrData) backParams.set("qrData", qrData);
  if (dynamic) backParams.set("dynamic", dynamic);
  const backHref = `/codes/${qr_id}?${backParams.toString()}`;

  const [qrCode, analytics] = await Promise.all([
    getQRCode(qr_id),
    getQRCodeAnalytics(qr_id),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back */}
        <Link
          href={backHref}
          className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
        >
          ← Back to QR Code
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground dark:text-white mb-1">
            📊 Analytics
          </h1>
          {qrCode?.display_name && (
            <p className="text-gray-500 dark:text-gray-400">{qrCode.display_name}</p>
          )}
        </div>

        <AnalyticsClient analytics={analytics} qrId={qr_id} />
      </div>
    </div>
  );
}
