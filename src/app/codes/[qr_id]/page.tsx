import Link from "next/link";
import { getQRCode } from "@/services/hovercode";
import QRCodeDetailClient from "./components";
import { getProjects } from "@/services/project";

export const dynamic = "force-dynamic";


export default async function QRCodeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ qr_id: string }>;
  searchParams: Promise<{ [key: string]: string | boolean | undefined }>;
}) {
  const { qr_id } = await params;
  let { dynamic, qrData } = await searchParams;
  const qrCode = await getQRCode(qr_id);
  const projects = await getProjects();

  dynamic = dynamic === "true" || dynamic === true;
  qrData = typeof qrData === "string" ? qrData : undefined;

  if (!qrCode) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/codes/all"
            className="inline-block mb-6 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to My Codes
          </Link>
          <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-6 py-4 rounded-lg">
            <p className="font-semibold text-lg">QR Code not found</p>
            <p className="text-sm mt-2">The QR code you're looking for doesn't exist or has been deleted.</p>
          </div>
        </div>
      </div>
    );
  }

  return <QRCodeDetailClient qrCode={qrCode} dynamic={dynamic} qrData={qrData} projects={projects} />;
}