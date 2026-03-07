import Link from "next/link";
import { BackgroundBeams } from "@/components/aceternity/background-beams";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap, ArrowDownLeft, ArrowUpRight } from "lucide-react";

const previewTransactions = [
  { label: "Salário", amount: "+R$ 8.500", type: "income", cat: "Renda" },
  { label: "Aluguel", amount: "-R$ 1.800", type: "expense", cat: "Moradia" },
  { label: "Supermercado", amount: "-R$ 450", type: "expense", cat: "Alimentação" },
  { label: "Freela Design", amount: "+R$ 1.200", type: "income", cat: "Renda" },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center bg-zinc-950 overflow-hidden">
      <BackgroundBeams />

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center text-center pt-32 pb-16 px-6 max-w-4xl w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-xs mb-8 backdrop-blur-sm">
          <Zap className="w-3 h-3" />
          Controle financeiro inteligente
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] mb-5 tracking-tight">
          Controle total
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_4s_linear_infinite]">
            das suas finanças
          </span>
        </h1>

        <p className="text-zinc-400 text-lg mb-10 max-w-lg leading-relaxed">
          Visualize gastos, acompanhe receitas e tome decisões baseadas em dados.
          Tudo em um único lugar, com design feito para clareza.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/register">
            <Button
              size="lg"
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-600/20"
            >
              Começar gratuitamente
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 bg-transparent hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
            >
              Entrar
            </Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-6 mt-14 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Análises em tempo real
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Dados protegidos
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700" />
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-violet-400" />
            Setup em minutos
          </span>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="relative z-10 w-full max-w-4xl px-6 pb-24">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md shadow-2xl shadow-black/40 overflow-hidden">
          {/* Fake window bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-950/50">
            <span className="w-3 h-3 rounded-full bg-red-500/50" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
            <span className="w-3 h-3 rounded-full bg-green-500/50" />
            <span className="ml-4 text-[11px] text-zinc-600 font-mono">
              financeos.app/dashboard
            </span>
          </div>

          <div className="p-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Saldo Total", value: "R$ 24.850", color: "text-white", glow: "border-blue-500/20 bg-blue-500/5" },
                { label: "Receitas", value: "R$ 8.500", color: "text-emerald-400", glow: "border-emerald-500/20 bg-emerald-500/5" },
                { label: "Despesas", value: "R$ 5.230", color: "text-red-400", glow: "border-red-500/20 bg-red-500/5" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`rounded-lg p-3 border ${s.glow}`}
                >
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                    {s.label}
                  </p>
                  <p className={`text-xl font-bold font-mono ${s.color}`}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart placeholder */}
            <div className="rounded-lg bg-zinc-800/40 border border-zinc-700/50 p-4 mb-4 h-28 flex items-end gap-1">
              {[38, 55, 42, 78, 58, 88, 52, 72, 82, 68, 92, 62].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t transition-colors"
                  style={{
                    height: `${h}%`,
                    background: `linear-gradient(to top, rgba(59,130,246,0.6), rgba(139,92,246,0.3))`,
                  }}
                />
              ))}
            </div>

            {/* Transactions */}
            <div className="space-y-1">
              {previewTransactions.map((tx, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg bg-zinc-800/30"
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center ${
                      tx.type === "income"
                        ? "bg-emerald-500/10"
                        : "bg-zinc-700/50"
                    }`}
                  >
                    {tx.type === "income" ? (
                      <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-zinc-400" />
                    )}
                  </div>
                  <span className="text-xs text-zinc-300 flex-1">{tx.label}</span>
                  <span className="text-[10px] text-zinc-600 px-1.5 py-0.5 rounded bg-zinc-800">
                    {tx.cat}
                  </span>
                  <span
                    className={`text-xs font-mono font-medium ${
                      tx.type === "income" ? "text-emerald-400" : "text-zinc-300"
                    }`}
                  >
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
