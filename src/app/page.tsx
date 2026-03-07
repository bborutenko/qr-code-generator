import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-foreground dark:text-white mb-3">
            QR Code Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Create and manage your QR codes effortlessly
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          {/* Create Button */}
          <Link
            href="/codes/create"
            className="block w-full px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-lg rounded-lg transition shadow-lg hover:shadow-xl"
          >
            ✨ Create New Code
          </Link>

          {/* View Button */}
          <Link
            href="/codes/all"
            className="block w-full px-8 py-4 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-semibold text-lg rounded-lg transition shadow-lg hover:shadow-xl"
          >
            📋 View Existing Codes
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-sm text-gray-500 dark:text-gray-600">
          <p>Manage all your QR codes in one place</p>
        </div>
      </div>
    </div>
  );
}
