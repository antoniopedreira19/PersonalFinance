import { getBankBySlug, getBankInitials } from "@/lib/banks"
import { cn } from "@/lib/utils"

interface BankLogoProps {
  slug: string
  name: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizes = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
}

export function BankLogo({ slug, name, size = "md", className }: BankLogoProps) {
  const bank = getBankBySlug(slug)
  const initials = getBankInitials(name)

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold flex-shrink-0",
        sizes[size],
        className
      )}
      style={{ backgroundColor: bank.color, color: bank.textColor }}
      title={name}
    >
      {initials}
    </div>
  )
}
