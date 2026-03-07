import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-4xl font-bold text-gray-900">Personal Finance</h1>
        <p className="text-lg text-gray-500">
          Controle suas finanças de forma simples e inteligente.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  );
}
