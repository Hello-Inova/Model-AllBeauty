// lucide-react v1 dropped brand/logo icons (trademark policy), so social
// network glyphs used across the public site and admin panel live here as
// small inline SVGs matching lucide's `size`/`className` calling convention.
import type { SVGProps } from 'react'

interface IconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

function base(props: IconProps) {
  const { size = 18, ...rest } = props
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...rest }
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export function TikTokIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </svg>
  )
}

// WhatsApp is used exclusively on solid brand-green surfaces (floating
// button, confirmation CTA), so — unlike the stroke-style icons above,
// meant to sit inline with lucide icons — it's rendered filled/solid like
// the real wordless glyph, for instant recognizability on that green pill.
export function WhatsAppIcon(props: IconProps) {
  const { size = 18, ...rest } = props
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...rest}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.5 3.62 1.44 5.19L2 22l5.06-1.55c1.44.8 3.06 1.22 4.98 1.22 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.61 14.02c-.24.66-1.19 1.22-1.65 1.29-.42.06-.96.09-1.55-.1-.36-.11-.82-.27-1.4-.53-2.47-1.07-4.08-3.56-4.2-3.72-.12-.16-1-1.33-1-2.54s.63-1.8.86-2.05c.22-.24.49-.3.65-.3l.47.01c.15.01.35-.06.55.42.2.5.7 1.71.76 1.83.06.13.1.27.02.43-.08.16-.12.27-.24.41l-.37.43c-.12.13-.25.26-.11.5.14.24.63 1.04 1.36 1.68.93.83 1.72 1.09 1.96 1.21.24.13.38.11.53-.06.15-.16.61-.71.77-.95.16-.24.32-.2.55-.12.23.08 1.43.67 1.68.79.25.13.41.19.47.29.06.11.06.6-.14 1.26z" />
    </svg>
  )
}
