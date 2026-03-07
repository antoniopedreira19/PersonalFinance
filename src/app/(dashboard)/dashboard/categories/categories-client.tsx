"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/categories"
import type { Category } from "@/lib/supabase/types"

const PRESET_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#f97316",
  "#eab308", "#06b6d4", "#ec4899", "#6b7280", "#14b8a6",
]

interface Props {
  categories: Category[]
}

export function CategoriesClient({ categories }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [type, setType] = useState<"income" | "expense">("expense")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  function openNew(defaultType: "income" | "expense") {
    setEditing(null)
    setName("")
    setType(defaultType)
    setColor(PRESET_COLORS[0])
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditing(cat)
    setName(cat.name)
    setType(cat.type as "income" | "expense")
    setColor(cat.color)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError("")
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), color })
      } else {
        await createCategory({ name: name.trim(), type, color })
      }
      setShowModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Remover categoria "${cat.name}"?`)) return
    await deleteCategory(cat.id)
  }

  function CategoryGroup({ title, items, type }: { title: string; items: Category[]; type: "income" | "expense" }) {
    return (
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">{title}</h2>
          <button
            onClick={() => openNew(type)}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 group hover:border-zinc-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: cat.color + "33", border: `1px solid ${cat.color}40` }}>
                <div className="w-full h-full rounded-lg flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
              </div>
              <span className="text-sm text-zinc-200 flex-1 truncate">{cat.name}</span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(cat)} className="p-1 text-zinc-500 hover:text-white">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(cat)} className="p-1 text-zinc-500 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div
              onClick={() => openNew(type)}
              className="flex items-center gap-3 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl px-3 py-3 cursor-pointer hover:border-zinc-600 transition-colors text-zinc-600 hover:text-zinc-400"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Adicionar</span>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-zinc-500 text-sm mt-1">Organize suas receitas e despesas</p>
        </div>

        <CategoryGroup title="Receitas" items={incomeCategories} type="income" />
        <CategoryGroup title="Despesas" items={expenseCategories} type="expense" />
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-5">
              {editing ? "Editar categoria" : "Nova categoria"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editing && (
                <div>
                  <label className="block text-xs text-zinc-400 mb-1.5">Tipo</label>
                  <div className="flex gap-2">
                    {(["income", "expense"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex-1 py-1.5 rounded-lg text-sm transition-colors ${
                          type === t
                            ? t === "income" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}
                      >
                        {t === "income" ? "Receita" : "Despesa"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Alimentação"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
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
