"use client"

import { useState } from "react"
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { BankLogo } from "@/components/dashboard/bank-logo"
import { createTransaction, createInstallmentTransaction, deleteTransaction } from "@/lib/actions/transactions"
import { NumberInput } from "@/components/ui/number-input"
import type { Bank, Category, TransactionWithRelations } from "@/lib/supabase/types"

const SUBTYPES = [
  { value: "non_recurring", label: "Receita Avulsa", type: "income" },
  { value: "recurring", label: "Receita Recorrente", type: "income" },
  { value: "daily", label: "Despesa Avulsa", type: "expense" },
  { value: "fixed", label: "Despesa Fixa", type: "expense" },
  { value: "installment", label: "Despesa Parcelada", type: "expense" },
  { value: "investment", label: "Investimento", type: "investment" },
] as const

interface Props {
  transactions: TransactionWithRelations[]
  banks: Bank[]
  categories: Category[]
}

export function TransactionsClient({ transactions, banks, categories }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [subtype, setSubtype] = useState<typeof SUBTYPES[number]["value"]>("daily")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [bankId, setBankId] = useState(banks[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState("")
  const [installments, setInstallments] = useState("2")
  const [notes, setNotes] = useState("")

  const selectedSubtype = SUBTYPES.find((s) => s.value === subtype)!
  const filteredCategories = categories.filter(
    (c) => selectedSubtype.type === "investment" ? true : c.type === selectedSubtype.type
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!bankId || !categoryId) { setError("Selecione banco e categoria"); return }
    setLoading(true)
    setError("")

    try {
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) throw new Error("Valor inválido")

      if (subtype === "installment") {
        const n = parseInt(installments)
        if (isNaN(n) || n < 2) throw new Error("Número de parcelas inválido")
        await createInstallmentTransaction(
          { bank_id: bankId, category_id: categoryId, description, amount: parsedAmount / n, notes: notes || null },
          date,
          n,
        )
      } else {
        await createTransaction({
          bank_id: bankId,
          category_id: categoryId,
          description,
          amount: parsedAmount,
          type: selectedSubtype.type as "income" | "expense" | "investment",
          subtype,
          date,
          notes: notes || null,
        })
      }

      setShowModal(false)
      setDescription("")
      setAmount("")
      setNotes("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setLoading(false)
    }
  }

  function typeIcon(type: string) {
    if (type === "income") return <TrendingUp className="w-4 h-4 text-emerald-400" />
    if (type === "investment") return <Minus className="w-4 h-4 text-violet-400" />
    return <TrendingDown className="w-4 h-4 text-red-400" />
  }

  function typeColor(type: string) {
    if (type === "income") return "text-emerald-400"
    if (type === "investment") return "text-violet-400"
    return "text-red-400"
  }

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Transações</h1>
            <p className="text-zinc-500 text-sm mt-1">{transactions.length} movimentações encontradas</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova transação
          </button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm">
              Nenhuma transação ainda. Adicione sua primeira movimentação.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-5 py-3">Descrição</th>
                  <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-3 py-3 hidden sm:table-cell">Banco</th>
                  <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-3 py-3 hidden md:table-cell">Categoria</th>
                  <th className="text-left text-[11px] text-zinc-500 uppercase tracking-wider px-3 py-3">Data</th>
                  <th className="text-right text-[11px] text-zinc-500 uppercase tracking-wider px-5 py-3">Valor</th>
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          {typeIcon(t.type)}
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{t.description}</p>
                          {t.installment_number && (
                            <p className="text-[10px] text-zinc-500">
                              Parcela {t.installment_number}/{t.total_installments}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <BankLogo slug={t.banks.slug} name={t.banks.name} size="sm" />
                        <span className="text-xs text-zinc-400">{t.banks.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: t.categories.color + "22", color: t.categories.color }}
                      >
                        {t.categories.name}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs text-zinc-500">
                        {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-sm font-mono font-medium ${typeColor(t.type)}`}>
                        {t.type === "expense" ? "-" : "+"}R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-5">Nova transação</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subtype */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  {SUBTYPES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => { setSubtype(s.value); setCategoryId("") }}
                      className={`py-2 px-3 rounded-lg text-xs text-left transition-colors border ${
                        subtype === s.value
                          ? "border-blue-500 bg-blue-500/10 text-blue-300"
                          : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Descrição</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Ex: Supermercado Extra"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Amount */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-zinc-400 mb-1.5">
                    Valor (R$){subtype === "installment" ? " total" : ""}
                  </label>
                  <NumberInput
                    value={amount}
                    onChange={setAmount}
                    step={0.01}
                    min={0.01}
                    required
                    placeholder="0,00"
                  />
                </div>
                {subtype === "installment" && (
                  <div className="w-28">
                    <label className="block text-xs text-zinc-400 mb-1.5">Parcelas</label>
                    <NumberInput
                      value={installments}
                      onChange={setInstallments}
                      min={2}
                      max={60}
                      step={1}
                    />
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">
                  Data{subtype === "installment" ? " da 1ª parcela" : ""}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Bank */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Banco</label>
                {banks.length === 0 ? (
                  <p className="text-xs text-amber-400">Cadastre um banco em Configurações primeiro.</p>
                ) : (
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
                {filteredCategories.length === 0 ? (
                  <p className="text-xs text-amber-400">Cadastre categorias em Categorias primeiro.</p>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Observações (opcional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalhes adicionais"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Salvando..." : subtype === "installment" ? `Criar ${installments}x` : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
