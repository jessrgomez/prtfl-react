import { useEffect, useRef, useState } from 'react'

interface Options {
  immediate?: boolean
}

/**
 * Reveals a section (via the returned `ref`) with an `animate-in`-style flag once it
 * scrolls into view. Pass `immediate: true` for content that should already
 * be visible on load (e.g. the hero).
 */
export function useAnimateOnScroll<T extends HTMLElement = HTMLElement>({ immediate = false }: Options = {}) {
  const target = useRef<T | null>(null)
  const [isVisible, setIsVisible] = useState(immediate)

  useEffect(() => {
    if (immediate || !target.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.01, rootMargin: '0px 0px -50px 0px' }
    )
    observer.observe(target.current)

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { target, isVisible }
}
