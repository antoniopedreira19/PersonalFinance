export const KNOWN_BANKS = [
  { slug: "nubank", name: "Nubank", color: "#8A05BE", textColor: "#fff" },
  { slug: "bradesco", name: "Bradesco", color: "#CC092F", textColor: "#fff" },
  { slug: "itau", name: "Itaú", color: "#EC7000", textColor: "#fff" },
  { slug: "santander", name: "Santander", color: "#EC0000", textColor: "#fff" },
  { slug: "caixa", name: "Caixa", color: "#0066B3", textColor: "#fff" },
  { slug: "bb", name: "Banco do Brasil", color: "#F9B000", textColor: "#000" },
  { slug: "inter", name: "Inter", color: "#FF7A00", textColor: "#fff" },
  { slug: "c6", name: "C6 Bank", color: "#242424", textColor: "#fff" },
  { slug: "xp", name: "XP", color: "#1A1A2E", textColor: "#fff" },
  { slug: "sicoob", name: "Sicoob", color: "#0C7B3E", textColor: "#fff" },
  { slug: "picpay", name: "PicPay", color: "#11C76F", textColor: "#fff" },
  { slug: "neon", name: "Neon", color: "#00E5A0", textColor: "#000" },
  { slug: "outros", name: "Outros", color: "#6B7280", textColor: "#fff" },
] as const

export type BankSlug = (typeof KNOWN_BANKS)[number]["slug"]

export function getBankBySlug(slug: string) {
  return KNOWN_BANKS.find((b) => b.slug === slug) ?? KNOWN_BANKS[KNOWN_BANKS.length - 1]
}

export function getBankInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
