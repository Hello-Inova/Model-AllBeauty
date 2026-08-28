import { Scissors, Sparkles, Eye, Sun, Waves, Palette, Flame, Tag, type LucideIcon } from 'lucide-react'

// Maps a Category.icon key (a short slug the admin panel could let a business
// pick from) to a Lucide icon component. Used to give the SmartImage
// fallback a meaningful icon per service/category before real photos are
// uploaded, instead of a generic placeholder.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cabelo: Scissors,
  unhas: Sparkles,
  'sobrancelhas-cilios': Eye,
  'estetica-facial': Sun,
  'massagem-spa': Waves,
  maquiagem: Palette,
  depilacao: Flame,
}

// `key` is expected to be the category's slug (e.g. category.slug), since
// demo/admin-created categories don't carry a separate `icon` field.
export function getCategoryIcon(key?: string | null): LucideIcon {
  if (!key) return Tag
  return CATEGORY_ICONS[key] ?? Tag
}
