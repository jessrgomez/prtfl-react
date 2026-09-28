import { useEffect, useMemo, useRef, useState } from 'react'
import { useAnimateOnScroll } from '../composables/useAnimateOnScroll'
import { scrollToSection } from '../utils/scroll'
import { projects } from '../data/projects'

export const initialCode = `const developer = {
  role: 'Frontend Developer',
  experience: '8 years',
  stack: ['Vue', 'JavaScript', 'REST APIs', 'HTML', 'CSS'],
  available: true
};`

interface Props {
  code: string
  onCodeChange: (code: string) => void
}

export default function HeroSection({ code, onCodeChange }: Props) {
  const { target, isVisible } = useAnimateOnScroll<HTMLElement>({ immediate: true })

  const industryCount = useMemo(() => new Set(projects.flatMap((project) => project.industries)).size, [])

  const stats = useMemo(
    () => [
      { value: 8, label: 'Years of experience' },
      { value: industryCount, label: 'Industries served' },
      { value: projects.length, label: 'Projects featured' }
    ],
    [industryCount]
  )

  const [displayValues, setDisplayValues] = useState(() => stats.map(() => 0))
  const [statsDone, setStatsDone] = useState(false)

  const codeEditor = useRef<HTMLTextAreaElement | null>(null)

  const fitCodeEditor = () => {
    const el = codeEditor.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    fitCodeEditor()
  }, [code])

  useEffect(() => {
    fitCodeEditor()
    window.addEventListener('resize', fitCodeEditor)

    const duration = 900
    const start = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValues(stats.map((stat) => Math.round(stat.value * eased)))
      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        setStatsDone(true)
      }
    }
    frameId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', fitCodeEditor)
      cancelAnimationFrame(frameId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="hero" ref={target} className={`section hero ${isVisible ? 'animate-in' : ''}`}>
      <div className="hero-content">
        <p className="hero-greeting">
          <span className="status-dot"></span> Open to meaningful opportunities
        </p>
        <h1 className="hero-name">Jessica Gomez</h1>
        <p className="hero-title">Frontend Developer with 8 years of experience building scalable web applications.</p>
        <p className="hero-desc">
          I build reliable, responsive web experiences and help cross-functional teams turn business requirements
          into production-ready products.
        </p>
        <div className="hero-specialties" aria-label="Professional specialties">
          <span>Vue &amp; React</span>
          <span>API Integration</span>
          <span>Project Coordination</span>
        </div>
        <div className="hero-cta">
          <a
            href="#projects"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('projects')
            }}
          >
            View Projects
          </a>
          <a
            href="#contact"
            className="btn btn-outline"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('contact')
            }}
          >
            Get in Touch
          </a>
          <a href="/Jessica-Gomez-CV.pdf" className="btn btn-outline" download>
            Download CV
          </a>
        </div>
        <dl className="hero-stats" aria-label="Career highlights">
          {stats.map((stat, i) => (
            <div key={stat.label}>
              <dt
                className={`hero-stat-value ${statsDone ? 'hero-stat-value--done' : ''}`}
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {displayValues[i]}
              </dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="hero-visual">
        <div className="code-block code-block-below" aria-label="Interactive developer profile">
          <div className="code-window-header">
            <div className="code-window-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>jessica.profile.js</span>
            <button type="button" onClick={() => onCodeChange(initialCode)}>
              Reset
            </button>
          </div>
          <label className="sr-only" htmlFor="developer-profile-code">
            Edit Jessica's developer profile code
          </label>
          <textarea
            id="developer-profile-code"
            ref={codeEditor}
            className="code-editable"
            spellCheck={false}
            rows={6}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
          ></textarea>
          <p className="hero-code-hint">Try changing the stack or availability—the About section updates live.</p>
        </div>
      </div>
    </section>
  )
}
