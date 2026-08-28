import { Link } from 'react-router-dom'
import { CalendarPlus, Sparkles, Building2 } from 'lucide-react'
import type { Business } from '../../types'
import { publicRoutes } from '../../utils/routes'
import { SmartImage } from '../SmartImage'
import { Button } from '../Form'

export function Hero({ business }: { business: Business }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <SmartImage asset={business.heroImage} alt={business.name} className="w-full h-full object-cover" icon={Sparkles} iconSize={56} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
      </div>
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 flex flex-col items-start gap-5 text-white">
        {business.demo && (
          <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-medium">
            <Sparkles size={12} /> Dados demonstrativos
          </span>
        )}
        <SmartImage
          asset={business.logo}
          alt={business.name}
          className="h-16 w-16 rounded-full object-cover border-2 border-white/40"
          fallbackClassName="h-16 w-16 rounded-full border-2 border-white/40"
          icon={Building2}
          iconSize={28}
        />
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold max-w-xl leading-tight">{business.displayName}</h1>
        <p className="max-w-lg text-white/85 text-base sm:text-lg">{business.description}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link to={publicRoutes.booking(business.slug)}>
            <Button size="lg" icon={<CalendarPlus size={18} />}>Agendar agora</Button>
          </Link>
          <Link to={publicRoutes.services(business.slug)}>
            <Button size="lg" variant="outline" className="!border-white/60 !text-white hover:!bg-white/10">
              Ver serviços
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
