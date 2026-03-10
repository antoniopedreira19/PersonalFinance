"use client"

import { useMemo } from "react"

interface Props {
  totalIncome: number
  totalExpenses: number
}

const SCENARIOS = [
  {
    key: "economista" as const,
    label: "Economista",
    limit: 60,
    color: "#10b981",
    colorRgb: "16, 185, 129",
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-500/40",
    textClass: "text-emerald-400",
    dimBorder: "border-zinc-800",
    icon: "🌱",
    zoneLabel: "até 60%",
    zoneLabelClass: "text-emerald-600/80",
  },
  {
    key: "intermediario" as const,
    label: "Intermediário",
    limit: 80,
    color: "#f59e0b",
    colorRgb: "245, 158, 11",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/40",
    textClass: "text-amber-400",
    dimBorder: "border-zinc-800",
    icon: "⚖️",
    zoneLabel: "60–80%",
    zoneLabelClass: "text-amber-600/80",
  },
  {
    key: "consumista" as const,
    label: "Consumista",
    limit: Infinity,
    color: "#ef4444",
    colorRgb: "239, 68, 68",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/40",
    textClass: "text-red-400",
    dimBorder: "border-zinc-800",
    icon: "🔥",
    zoneLabel: "80%+",
    zoneLabelClass: "text-red-600/80",
  },
] as const

type ScenarioKey = "economista" | "intermediario" | "consumista"

function getScenario(ratio: number) {
  if (ratio <= 60) return SCENARIOS[0]
  if (ratio <= 80) return SCENARIOS[1]
  return SCENARIOS[2]
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
}

function getCardContent(
  key: ScenarioKey,
  currentKey: ScenarioKey,
  ratio: number,
): { headline: string; sub: string; isGoal?: boolean; isDanger?: boolean } {
  const isActive = key === currentKey

  if (key === "economista") {
    if (isActive) {
      return {
        headline: "Você está aqui",
        sub: `Poupando ${(100 - ratio).toFixed(0)}% da receita`,
      }
    }
    const toReduce = ratio - 60
    return {
      headline: "Seu objetivo",
      sub: toReduce > 0
        ? `Reduza ${toReduce.toFixed(0)}% nos gastos`
        : "Mantenha seus gastos controlados",
      isGoal: true,
    }
  }

  if (key === "intermediario") {
    if (isActive) {
      return {
        headline: "Você está aqui",
        sub: `Reduza ${(ratio - 60).toFixed(0)}% para ser Economista`,
      }
    }
    if (currentKey === "economista") {
      return { headline: "Zona de atenção", sub: "Evite ultrapassar 60% dos gastos" }
    }
    return { headline: "Próximo passo", sub: "Fique abaixo de 80% da receita" }
  }

  // consumista
  if (isActive) {
    return {
      headline: "Zona de risco",
      sub: `${(ratio - 80).toFixed(0)}% acima do recomendado`,
      isDanger: true,
    }
  }
  return {
    headline: "Nunca chegue aqui",
    sub: "Gastos altos comprometem seu futuro",
    isDanger: true,
  }
}

export function SpendingScenarios({ totalIncome, totalExpenses }: Props) {
  const ratio = useMemo(() => {
    if (!totalIncome || totalIncome <= 0) return 0
    return (totalExpenses / totalIncome) * 100
  }, [totalIncome, totalExpenses])

  const current = getScenario(ratio)
  // Bar visual: 110% maps to 100% width
  const barFill = Math.min(ratio, 110) / 110 * 100
  const dotPos = Math.min(barFill, 98.5)
  const hasData = totalIncome > 0
  const savings = totalIncome - totalExpenses

  return (
    <>
      <style>{`
        @keyframes sp-glow-emerald {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(16,185,129,0.45); }
          50%       { box-shadow: 0 0 18px 5px rgba(16,185,129,0.75); }
        }
        @keyframes sp-glow-amber {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(245,158,11,0.45); }
          50%       { box-shadow: 0 0 18px 5px rgba(245,158,11,0.75); }
        }
        @keyframes sp-glow-red {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(239,68,68,0.5); }
          50%       { box-shadow: 0 0 22px 6px rgba(239,68,68,0.85); }
        }
        @keyframes sp-badge-emerald {
          0%, 100% { box-shadow: 0 0 8px 1px rgba(16,185,129,0.35); }
          50%       { box-shadow: 0 0 18px 4px rgba(16,185,129,0.65); }
        }
        @keyframes sp-badge-amber {
          0%, 100% { box-shadow: 0 0 8px 1px rgba(245,158,11,0.35); }
          50%       { box-shadow: 0 0 18px 4px rgba(245,158,11,0.65); }
        }
        @keyframes sp-badge-red {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(239,68,68,0.45); }
          50%       { box-shadow: 0 0 20px 6px rgba(239,68,68,0.75); }
        }
        @keyframes sp-card-danger {
          0%, 100% { border-color: rgba(239,68,68,0.35); }
          50%       { border-color: rgba(239,68,68,0.7); }
        }
        @keyframes sp-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .sp-dot-emerald { animation: sp-glow-emerald 2s ease-in-out infinite; }
        .sp-dot-amber   { animation: sp-glow-amber   2s ease-in-out infinite; }
        .sp-dot-red     { animation: sp-glow-red     1.4s ease-in-out infinite; }
        .sp-badge-emerald { animation: sp-badge-emerald 3s ease-in-out infinite; }
        .sp-badge-amber   { animation: sp-badge-amber   2.5s ease-in-out infinite; }
        .sp-badge-red     { animation: sp-badge-red     1.8s ease-in-out infinite; }
        .sp-card-danger-pulse { animation: sp-card-danger 1.8s ease-in-out infinite; }
        .sp-bar-fill { transition: width 1s cubic-bezier(0.4,0,0.2,1), background-color 0.7s ease; }
        .sp-dot      { transition: left 1s cubic-bezier(0.4,0,0.2,1), background-color 0.7s ease; }
      `}</style>

      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white">Perfil de Gastos</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Com base na receita do mês</p>
          </div>
          {hasData && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${current.bgClass} ${current.borderClass} ${current.textClass} sp-badge-${current.key === "economista" ? "emerald" : current.key === "intermediario" ? "amber" : "red"}`}
            >
              <span className="text-sm leading-none">{current.icon}</span>
              <span>{current.label}</span>
            </div>
          )}
        </div>

        {!hasData ? (
          <div className="py-6 text-center text-zinc-600 text-sm">
            Adicione receitas para calcular seu perfil
          </div>
        ) : (
          <>
            {/* Big ratio + savings row */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <span className={`text-2xl font-bold font-mono tabular-nums ${current.textClass}`}>
                  {ratio.toFixed(1)}%
                </span>
                <span className="text-xs text-zinc-500 ml-2">da receita em despesas</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-1">
              <div className="relative h-4 rounded-full overflow-hidden"
                style={{ background: "linear-gradient(to right, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.12) 54.5%, rgba(245,158,11,0.12) 54.5%, rgba(245,158,11,0.12) 72.7%, rgba(239,68,68,0.12) 72.7%, rgba(239,68,68,0.12) 100%)" }}
              >
                {/* Zone dividers */}
                <div className="absolute inset-y-0 left-[54.5%] w-px bg-zinc-700/60" />
                <div className="absolute inset-y-0 left-[72.7%] w-px bg-zinc-700/60" />

                {/* Fill bar */}
                <div
                  className="sp-bar-fill absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${barFill}%`,
                    background: `linear-gradient(90deg, ${current.color}99 0%, ${current.color} 100%)`,
                  }}
                />
              </div>

              {/* Marker dot (outside overflow:hidden wrapper) */}
              <div className="relative h-0">
                <div
                  className={`sp-dot absolute -top-5 w-4 h-4 rounded-full border-2 border-zinc-900 -translate-x-1/2 sp-dot-${current.key === "economista" ? "emerald" : current.key === "intermediario" ? "amber" : "red"}`}
                  style={{
                    left: `${dotPos}%`,
                    backgroundColor: current.color,
                  }}
                />
              </div>

              {/* Zone labels */}
              <div className="flex mt-2 text-[9px] font-medium select-none">
                <div className="w-[54.5%] text-center text-emerald-600/70">até 60%</div>
                <div className="w-[18.2%] text-center text-amber-600/70">60–80%</div>
                <div className="flex-1 text-center text-red-600/70">80%+</div>
              </div>
            </div>

            {/* Scenario cards */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              {SCENARIOS.map((s) => {
                const isActive = s.key === current.key
                const content = getCardContent(s.key, current.key, ratio)

                // Always give Economista a "goal" glow when not active
                const isGoalHighlight = !isActive && s.key === "economista"
                // Always give Consumista a "danger" style
                const isDangerHighlight = !isActive && s.key === "consumista"

                let cardClass = "rounded-lg border p-3 transition-all duration-500 "
                let cardStyle: React.CSSProperties = {}

                if (isActive) {
                  cardClass += `${s.bgClass} ${s.borderClass} `
                  cardStyle = {
                    boxShadow: s.key === "consumista"
                      ? `0 0 0 1px rgba(${s.colorRgb},0.25), 0 4px 24px rgba(${s.colorRgb},0.18)`
                      : `0 0 0 1px rgba(${s.colorRgb},0.2), 0 4px 20px rgba(${s.colorRgb},0.14)`,
                  }
                } else if (isGoalHighlight) {
                  cardClass += "bg-emerald-500/5 border-emerald-500/20 "
                } else if (isDangerHighlight) {
                  cardClass += "sp-card-danger-pulse bg-red-500/5 "
                } else {
                  cardClass += "border-zinc-800 bg-zinc-800/20 "
                }

                return (
                  <div key={s.key} className={cardClass} style={cardStyle}>
                    {/* Card header */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`text-sm leading-none ${!isActive && !isGoalHighlight && "opacity-50"}`}>
                        {s.icon}
                      </span>
                      <span className={`text-[11px] font-semibold ${
                        isActive ? s.textClass
                        : isGoalHighlight ? "text-emerald-500/70"
                        : isDangerHighlight ? "text-red-500/50"
                        : "text-zinc-600"
                      }`}>
                        {s.label}
                      </span>
                      {isActive && (
                        <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-medium ${s.bgClass} ${s.textClass}`}>
                          atual
                        </span>
                      )}
                      {isGoalHighlight && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-500/70">
                          meta
                        </span>
                      )}
                    </div>

                    <p className={`text-[10px] font-medium leading-tight ${
                      isActive ? s.textClass
                      : isGoalHighlight ? "text-emerald-400/60"
                      : isDangerHighlight ? "text-red-400/50"
                      : "text-zinc-600"
                    }`}>
                      {content.headline}
                    </p>
                    <p className={`text-[10px] leading-relaxed mt-0.5 ${
                      isActive ? "text-zinc-400"
                      : isGoalHighlight ? "text-zinc-500/70"
                      : "text-zinc-600/60"
                    }`}>
                      {content.sub}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Motivational footer */}
            <div className={`mt-3 flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-colors duration-500 ${
              current.key === "economista"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : current.key === "intermediario"
                ? "bg-amber-500/5 border-amber-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-medium ${current.textClass}`}>
                  {current.key === "economista" &&
                    `Parabéns! Você está ${(60 - ratio).toFixed(0)}% abaixo do limite — continue assim.`}
                  {current.key === "intermediario" &&
                    `Reduza R$ ${fmtBRL((ratio - 60) / 100 * totalIncome)} nos gastos para entrar no perfil Economista.`}
                  {current.key === "consumista" &&
                    `Reduza R$ ${fmtBRL((ratio - 60) / 100 * totalIncome)} nos gastos para atingir o perfil Economista.`}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
