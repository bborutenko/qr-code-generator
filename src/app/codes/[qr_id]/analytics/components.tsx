"use client";

import type { HovercodePaginatedAnalyticsResponse } from "@/schemas/hovercode";

interface Props {
  analytics: HovercodePaginatedAnalyticsResponse;
  qrId: string;
}

export default function AnalyticsClient({ analytics, qrId }: Props) {
  const { count, results } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Total Scans</p>
          <p className="text-4xl font-bold text-foreground dark:text-white">{count}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Shown (this page)</p>
          <p className="text-4xl font-bold text-foreground dark:text-white">{results.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">QR Code ID</p>
          <p className="text-sm font-mono text-foreground dark:text-white truncate">{qrId}</p>
        </div>
      </div>

      {/* Table */}
      {results.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg font-semibold text-foreground dark:text-white mb-1">No scans yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Share your QR code and scans will appear here.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Device</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Scanner ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {results.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-foreground dark:text-white font-medium">{item.time_timezone_aware}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.time_utc.slice(0, 10)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span className="text-foreground dark:text-white">{item.location || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span>📱</span>
                        <span className="text-foreground dark:text-white">{item.device || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="font-mono text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]" title={item.scanner_id}>
                        {item.scanner_id.slice(0, 16)}…
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
