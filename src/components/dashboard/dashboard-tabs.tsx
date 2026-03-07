"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Plus, X,
  TrendingUp, RefreshCw, Receipt, CreditCard, Wallet, BarChart2,
  Pencil, Trash2, Check, CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/Select"
import { createTransaction, createInstallmentTransaction } from "@/lib/actions/transactions"
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories"
import { createRecurringTemplate, toggleRecurringTemplate } from "@/lib/actions/recurring"
import type { Bank, Category } from "@/lib/supabase/types"

type RecurringTemplate = {
  id: string
  description: string
  amount: number
  type: string
  day_of_month: number
  is_active: boolean
  start_date: string
  banks: { id: string; name: string; color: string }
  categories: { id: string; name: string; color: string }
}

interface Props {
  banks: Bank[]
  categories: Category[]
  recurringTemplates: RecurringTemplate[]
}

// ─── Transaction Modal ────────────────────────────────────────────────────────

type SubtypeOption = {
  id: string
  label: string
  icon: React.ReactNode
  type: "income" | "expense" | "investment"
  subtype: string
}

const SUBTYPE_OPTIONS: SubtypeOption[] = [
  { id: "recurring_income", label: "Receita Recorrente", icon: <RefreshCw className="w-4 h-4" />, type: "income", subtype: "recurring" },
  { id: "non_recurring_income", label: "Receita Avulsa", icon: <TrendingUp className="w-4 h-4" />, type: "income", subtype: "non_recurring" },
  { id: "fixed_expense", label: "Despesa Fixa", icon: <Receipt className="w-4 h-4" />, type: "expense", subtype: "fixed" },
  { id: "installment_expense", label: "Despesa Parcelada", icon: <CreditCard className="w-4 h-4" />, type: "expense", subtype: "installment" },
  { id: "daily_expense", label: "Despesa Avulsa", icon: <Wallet className="w-4 h-4" />, type: "expense", subtype: "daily" },
  { id: "investment", label: "Investimento", icon: <BarChart2 className="w-4 h-4" />, type: "investment", subtype: "investment" },
]

const SUBTYPE_COLORS: Record<string, string> = {
  recurring_income: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:border-emerald-400/50",
  non_recurring_income: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 data-[selected=true]:bg-emerald-500/15 data-[selected=true]:border-emerald-400/50",
  fixed_expense: "text-red-400 border-red-500/30 bg-red-500/5 data-[selected=true]:bg-red-500/15 data-[selected=true]:border-red-400/50",
  installment_expense: "text-orange-400 border-orange-500/30 bg-orange-500/5 data-[selected=true]:bg-orange-500/15 data-[selected=true]:border-orange-400/50",
  daily_expense: "text-zinc-400 border-zinc-600/40 bg-zinc-800/50 data-[selected=true]:bg-zinc-700/60 data-[selected=true]:border-zinc-500/60",
  investment: "text-violet-400 border-violet-500/30 bg-violet-500/5 data-[selected=true]:bg-violet-500/15 data-[selected=true]:border-violet-400/50",
}

function TransactionModal({ banks, categories, recurringTemplates, onClose, onViewRecurring }: {
  banks: Bank[]
  categories: Category[]
  recurringTemplates: RecurringTemplate[]
  onClose: () => void
  onViewRecurring: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [bankId, setBankId] = useState(banks[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState("")
  const [notes, setNotes] = useState("")
  const [installments, setInstallments] = useState("2")
  const [error, setError] = useState("")

  const selected = SUBTYPE_OPTIONS.find((o) => o.id === selectedSubtype)
  const isRecurringMode = selectedSubtype === "recurring_income" || selectedSubtype === "fixed_expense"
  const filteredCategories = categories.filter((c) =>
    selected ? c.type === (selected.type === "investment" ? "expense" : selected.type) : true
  )
  const filteredTemplates = recurringTemplates.filter((t) =>
    selected ? t.type === selected.type : false
  )

  async function handleRecurringSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError("Valor inválido"); return }
    if (!date) { setError("Selecione a data de início"); return }
    if (!bankId) { setError("Selecione um banco"); return }
    if (!categoryId) { setError("Selecione uma categoria"); return }
    if (!description.trim()) { setError("Descrição obrigatória"); return }

    setError("")
    startTransition(async () => {
      try {
        await createRecurringTemplate({
          bank_id: bankId,
          category_id: categoryId,
          description: description.trim(),
          amount: amt,
          type: selected.type as "income" | "expense",
          day_of_month: date.getDate(),
          start_month: format(date, "yyyy-MM"),
          notes: notes || null,
        })
        router.refresh()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar")
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) { setError("Selecione um tipo"); return }
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError("Valor inválido"); return }
    if (!bankId) { setError("Selecione um banco"); return }
    if (!categoryId) { setError("Selecione uma categoria"); return }

    if (!date) { setError("Selecione uma data"); return }
    const dateStr = format(date, "yyyy-MM-dd")

    setError("")
    startTransition(async () => {
      try {
        if (selected.subtype === "installment") {
          await createInstallmentTransaction(
            { bank_id: bankId, category_id: categoryId, description, amount: amt, notes: notes || null },
            dateStr,
            parseInt(installments)
          )
        } else {
          await createTransaction({
            bank_id: bankId,
            category_id: categoryId,
            description,
            amount: amt,
            type: selected.type,
            subtype: selected.subtype,
            date: dateStr,
            notes: notes || null,
          })
        }
        router.refresh()
        onClose()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar")
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Nova Transação</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div>
            <p className="text-xs text-zinc-500 mb-2">Tipo de movimentação</p>
            <div className="grid grid-cols-3 gap-2">
              {SUBTYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  data-selected={selectedSubtype === opt.id}
                  onClick={() => { setSelectedSubtype(opt.id); setCategoryId("") }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all",
                    SUBTYPE_COLORS[opt.id]
                  )}
                >
                  {opt.icon}
                  <span className="text-center leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* "Ver cadastradas" button for recurring mode */}
          {isRecurringMode && (
            <button
              type="button"
              onClick={onViewRecurring}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver cadastradas ({filteredTemplates.length}) →
            </button>
          )}

          {selectedSubtype && (
            <form id="tx-form" onSubmit={isRecurringMode ? handleRecurringSubmit : handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Descrição</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Ex: Aluguel, Salário..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0,00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                {isRecurringMode ? (
                  <>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Dia do mês</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        required
                        placeholder="Ex: 5"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-[10px] text-zinc-600 mt-1">Se o mês não tiver este dia, usa o último</p>
                    </div>
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">Mês inicial</label>
                      <input
                        type="month"
                        value={startMonth}
                        onChange={(e) => setStartMonth(e.target.value)}
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Data</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm text-left",
                            !date && "text-zinc-500"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 text-zinc-500 shrink-0" />
                          {date ? format(date, "dd/MM/yyyy") : "Selecionar data"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
                {selectedSubtype === "installment_expense" && (
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Número de parcelas</label>
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Banco</label>
                  <Select value={bankId} onValueChange={setBankId}>
                    <SelectTrigger>
                      <SelectValue placeholder={banks.length === 0 ? "Nenhum banco" : "Selecionar..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Categoria</label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Notas (opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </form>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="tx-form"
            disabled={isPending || !selectedSubtype}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Category Modal ───────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16",
]

function CategoryModal({ categories, onClose }: { categories: Category[]; onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState<"income" | "expense">("expense")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editColor, setEditColor] = useState("")
  const [error, setError] = useState("")

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) { setError("Nome obrigatório"); return }
    setError("")
    startTransition(async () => {
      try {
        await createCategory({ name: newName.trim(), type: newType, color: newColor })
        setNewName("")
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro")
      }
    })
  }

  async function handleUpdate(id: string) {
    startTransition(async () => {
      try {
        await updateCategory(id, { name: editName, color: editColor })
        setEditingId(null)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro")
      }
    })
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      try {
        await deleteCategory(id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro")
      }
    })
  }

  function CategoryRow({ cat }: { cat: Category }) {
    const isEditing = editingId === cat.id
    if (isEditing) {
      return (
        <div className="flex items-center gap-2 py-1.5">
          <div className="flex gap-1 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setEditColor(c)}
                style={{ backgroundColor: c }}
                className={cn("w-4 h-4 rounded-full shrink-0 ring-offset-zinc-900", editColor === c && "ring-2 ring-white ring-offset-1")}
              />
            ))}
          </div>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button onClick={() => handleUpdate(cat.id)} className="text-emerald-400 hover:text-emerald-300 p-1">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 py-1.5 group/cat">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
        <span className="text-sm text-zinc-300 flex-1">{cat.name}</span>
        <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color) }} className="opacity-0 group-hover/cat:opacity-100 text-zinc-500 hover:text-white transition-all p-1">
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={() => handleDelete(cat.id)} className="opacity-0 group-hover/cat:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-base font-semibold text-white">Categorias</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {incomeCategories.length > 0 && (
            <div>
              <p className="text-[10px] text-emerald-500 uppercase tracking-widest mb-2">Receitas</p>
              <div className="divide-y divide-zinc-800/60">
                {incomeCategories.map((cat) => <CategoryRow key={cat.id} cat={cat} />)}
              </div>
            </div>
          )}
          {expenseCategories.length > 0 && (
            <div>
              <p className="text-[10px] text-red-500 uppercase tracking-widest mb-2">Despesas</p>
              <div className="divide-y divide-zinc-800/60">
                {expenseCategories.map((cat) => <CategoryRow key={cat.id} cat={cat} />)}
              </div>
            </div>
          )}
          {categories.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-4">Nenhuma categoria ainda</p>
          )}

          <form onSubmit={handleCreate} className="border-t border-zinc-800 pt-5 space-y-3">
            <p className="text-xs text-zinc-400 font-medium">Nova categoria</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewType("expense")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  newType === "expense"
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
                )}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => setNewType("income")}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  newType === "income"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
                )}
              >
                Receita
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn("w-5 h-5 rounded-full ring-offset-zinc-900", newColor === c && "ring-2 ring-white ring-offset-1")}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome da categoria"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </form>
        </div>

        <div className="px-6 pb-6 pt-4 border-t border-zinc-800 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Action Tabs ────────────────────────────────────────────────────

export function DashboardActionTabs({ banks, categories, recurringTemplates }: Props) {
  const [modal, setModal] = useState<"transactions" | "categories" | null>(null)

  return (
    <>
      <div className="inline-flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 gap-0.5">
        <button
          onClick={() => setModal("transactions")}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          Transações
        </button>
        <button
          onClick={() => setModal("categories")}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
        >
          Categorias
        </button>
      </div>

      {modal === "transactions" && (
        <TransactionModal
          banks={banks}
          categories={categories}
          recurringTemplates={recurringTemplates}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "categories" && (
        <CategoryModal
          categories={categories}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
