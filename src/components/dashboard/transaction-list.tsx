import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TransactionWithRelations } from "@/lib/supabase/types";

export function TransactionList({ transactions }: { transactions: TransactionWithRelations[] }) {
  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">Transações Recentes</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{transactions.length} este mês</p>
        </div>
        <Link href="/dashboard/transactions" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          Ver todas →
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="py-8 text-center text-zinc-600 text-sm">Nenhuma transação este mês</div>
      ) : (
        <div className="space-y-0.5">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  tx.type === "income"
                    ? "bg-emerald-500/10 border border-emerald-500/20"
                    : tx.type === "investment"
                    ? "bg-violet-500/10 border border-violet-500/20"
                    : "bg-zinc-800 border border-zinc-700"
                )}
              >
                {tx.type === "income" ? (
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                ) : tx.type === "investment" ? (
                  <Minus className="w-3.5 h-3.5 text-violet-400" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-200 truncate">{tx.description}</p>
                <p className="text-[11px] text-zinc-600">
                  {new Date(tx.date + "T00:00:00").toLocaleDateString("pt-BR")}
                </p>
              </div>

              <span
                className="text-[10px] px-2 py-0.5 rounded-full hidden sm:inline-block"
                style={{
                  backgroundColor: tx.categories.color + "22",
                  color: tx.categories.color,
                }}
              >
                {tx.categories.name}
              </span>

              <span
                className={cn(
                  "text-sm font-mono font-medium flex-shrink-0",
                  tx.type === "income" ? "text-emerald-400" : tx.type === "investment" ? "text-violet-400" : "text-zinc-300"
                )}
              >
                {tx.type === "income" ? "+" : "-"}R${" "}
                {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
