import { useEffect } from 'react'
import type { Business } from '../types'
import { useResolvedImage } from '../hooks/useImage'

interface SEOProps {
  business: Business
  title: string
  description: string
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setJsonLd(id: string, data: unknown) {
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.id = id
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

/** Dynamically writes title/meta/OG/schema.org tags from the current business's data. */
export function SEO({ business, title, description }: SEOProps) {
  const heroSrc = useResolvedImage(business.heroImage)
  const faviconSrc = useResolvedImage(business.favicon)

  useEffect(() => {
    document.title = `${title} · ${business.displayName}`
    setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:type', 'business.business', 'property')
    setMeta('og:site_name', business.displayName, 'property')
    if (heroSrc) setMeta('og:image', heroSrc, 'property')
    setMeta('twitter:card', 'summary_large_image')

    if (faviconSrc) {
      const link = document.getElementById('app-favicon') as HTMLLinkElement | null
      if (link) link.href = faviconSrc
    }

    setJsonLd('business-schema', {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      description: business.description,
      telephone: business.phone,
      email: business.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address,
        addressLocality: business.city,
        addressRegion: business.state,
        postalCode: business.zipCode,
        addressCountry: business.country,
      },
    })
  }, [business, title, description, heroSrc, faviconSrc])

  return null
}
