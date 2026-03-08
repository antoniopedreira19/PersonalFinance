"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Power, CreditCard } from "lucide-react"
import { KNOWN_BANKS } from "@/lib/banks"
import { BankLogo } from "@/components/dashboard/bank-logo"
import { createBank, updateBank, deleteBank } from "@/lib/actions/banks"
import type { Bank } from "@/lib/supabase/types"

type ExtendedBank = Bank & {
  account_type?: string
  closing_day?: number | null
  payment_due_day?: number | null
}

interface Props {
  banks: ExtendedBank[]
  profile: { name: string | null; avatar_url: string | null } | null
  userEmail: string
}

export function SettingsClient({ banks, profile, userEmail }: Props) {
  const [showBankModal, setShowBankModal] = useState(false)
  const [editingBank, setEditingBank] = useState<ExtendedBank | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string>(KNOWN_BANKS[0].slug)
  const [customName, setCustomName] = useState("")
  const [balance, setBalance] = useState("")
  const [accountType, setAccountType] = useState<"checking" | "savings" | "credit_card">("checking")
  const [closingDay, setClosingDay] = useState("")
  const [paymentDueDay, setPaymentDueDay] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedKnown = KNOWN_BANKS.find((b) => b.slug === selectedSlug)

  async function handleBankSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const name = customName.trim() || selectedKnown?.name || ""
      const creditCardFields = accountType === "credit_card"
        ? {
            closing_day: closingDay ? parseInt(closingDay) : null,
            payment_due_day: paymentDueDay ? parseInt(paymentDueDay) : null,
          }
        : { closing_day: null, payment_due_day: null }
      if (editingBank) {
        await updateBank(editingBank.id, {
          name,
          current_balance: parseFloat(balance) || 0,
          account_type: accountType,
          ...creditCardFields,
        })
      } else {
        await createBank({
          name,
          slug: selectedSlug,
          color: selectedKnown?.color ?? "#6B7280",
          current_balance: parseFloat(balance) || 0,
          account_type: accountType,
          ...creditCardFields,
        })
      }
      setShowBankModal(false)
      setEditingBank(null)
      setCustomName("")
      setBalance("")
      setAccountType("checking")
      setClosingDay("")
      setPaymentDueDay("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar banco")
    } finally {
      setLoading(false)
    }
  }

  function openEditBank(bank: ExtendedBank) {
    setEditingBank(bank)
    setSelectedSlug(bank.slug)
    setCustomName(bank.name)
    setBalance(bank.current_balance.toString())
    setAccountType((bank.account_type as "checking" | "savings" | "credit_card") ?? "checking")
    setClosingDay(bank.closing_day?.toString() ?? "")
    setPaymentDueDay(bank.payment_due_day?.toString() ?? "")
    setShowBankModal(true)
  }

  async function handleToggleActive(bank: Bank) {
    await updateBank(bank.id, { is_active: !bank.is_active })
  }

  async function handleDelete(bank: Bank) {
    if (!confirm(`Remover "${bank.name}"? Transações vinculadas serão afetadas.`)) return
    await deleteBank(bank.id)
  }

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 p-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-zinc-500 text-sm mt-1">Gerencie seus bancos e perfil</p>
        </div>

        {/* Banks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Bancos</h2>
            <button
              onClick={() => { setEditingBank(null); setCustomName(""); setBalance(""); setAccountType("checking"); setClosingDay(""); setPaymentDueDay(""); setShowBankModal(true) }}
              className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar banco
            </button>
          </div>

          <div className="space-y-2">
            {banks.length === 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-500 text-sm">
                Nenhum banco cadastrado. Adicione seu primeiro banco.
              </div>
            )}
            {banks.map((bank) => (
              <div
                key={bank.id}
                className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
              >
                <BankLogo slug={bank.slug} name={bank.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium text-sm ${bank.is_active ? "text-white" : "text-zinc-500"}`}>
                      {bank.name}
                    </p>
                    {bank.account_type === "credit_card" && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full">
                        <CreditCard className="w-2.5 h-2.5" />
                        Cartão
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {bank.account_type === "credit_card"
                      ? `Fecha dia ${bank.closing_day ?? "—"} · Vence dia ${bank.payment_due_day ?? "—"}`
                      : <>Saldo:{" "}
                          <span className={bank.current_balance >= 0 ? "text-emerald-400" : "text-red-400"}>
                            R$ {bank.current_balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </>
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditBank(bank)}
                    className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(bank)}
                    className={`p-1.5 transition-colors ${bank.is_active ? "text-emerald-400 hover:text-zinc-400" : "text-zinc-600 hover:text-emerald-400"}`}
                    title={bank.is_active ? "Desativar" : "Ativar"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bank)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Profile */}
        <section>
          <h2 className="text-base font-semibold text-white mb-4">Perfil</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                {(profile?.name ?? userEmail)[0].toUpperCase()}
              </div>
              <div>
                <p className="text-white font-medium">{profile?.name ?? "—"}</p>
                <p className="text-zinc-500 text-sm">{userEmail}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-600">Edição de perfil em breve.</p>
          </div>
        </section>
      </div>

      {/* Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5">
              {editingBank ? "Editar banco" : "Adicionar banco"}
            </h3>

            <form onSubmit={handleBankSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Banco</label>
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {KNOWN_BANKS.map((b) => (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => { setSelectedSlug(b.slug); setCustomName("") }}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border text-xs transition-colors ${
                        selectedSlug === b.slug
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-zinc-800 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      <BankLogo slug={b.slug} name={b.name} size="sm" />
                      <span className="truncate w-full text-center">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedSlug === "outros" && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Nome personalizado</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nome do banco"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Tipo de conta</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["checking", "savings", "credit_card"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAccountType(type)}
                      className={`py-2 rounded-lg border text-xs transition-colors ${
                        accountType === type
                          ? "border-blue-500 bg-blue-500/10 text-white"
                          : "border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {type === "checking" ? "Conta Corrente" : type === "savings" ? "Poupança" : "Cartão de Crédito"}
                    </button>
                  ))}
                </div>
              </div>

              {accountType === "credit_card" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Dia de fechamento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      placeholder="Ex: 20"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1.5">Dia de vencimento</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Saldo atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
