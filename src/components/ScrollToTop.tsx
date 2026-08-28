import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * React Router (including HashRouter) never resets scroll position on
 * client-side navigation — the new page renders wherever the previous page
 * happened to be scrolled to. Without this, clicking a service from partway
 * down the catalog lands the visitor mid-page (often near the footer) on
 * the service detail page instead of at the top. Mount once inside the
 * router so every route change scrolls back to the top.
 */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
