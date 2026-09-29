import { useEffect, useState } from 'react'
import { scrollToSection } from '../utils/scroll'
import { useTheme } from '../composables/useTheme'

const sections = [
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Work' },
  { id: 'experience', label: 'Career' },
  { id: 'education', label: 'Credentials' },
  { id: 'contact', label: 'Contact' }
]

export default function NavBar() {
  const { theme, toggleTheme } = useTheme()
  const [activeSection, setActiveSection] = useState('hero')
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)
  const toggleMenu = () => setMenuOpen((open) => !open)

  const goToSection = (id: string) => {
    scrollToSection(id)
    closeMenu()
  }

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
  }, [menuOpen])

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 150
      if (window.scrollY < 100) {
        setActiveSection('hero')
        return
      }
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id)
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('keydown', handleKeydown)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('keydown', handleKeydown)
      document.body.classList.remove('menu-open')
    }
  }, [])

  return (
    <nav className={`nav ${activeSection !== 'hero' ? 'scrolled' : ''}`} aria-label="Primary navigation">
      <a
        href="#"
        className="logo"
        onClick={(e) => {
          e.preventDefault()
          goToSection('hero')
        }}
      >
        <span className="logo-bracket">&lt;</span>JG<span className="logo-bracket">/&gt;</span>
        <span className="logo-name">Jessica Gomez</span>
      </a>
      {menuOpen && (
        <button className="nav-backdrop" type="button" aria-label="Close navigation" onClick={closeMenu}></button>
      )}
      <div className="nav-right">
        <ul id="primary-menu" className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={activeSection === section.id ? 'active' : ''}
                aria-current={activeSection === section.id ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault()
                  goToSection(section.id)
                }}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <a href="/admin/" target="_blank" rel="noopener noreferrer" className="nav-cms-link">
            Bot CMS
          </a>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            )}
          </button>
          <button
            className={`nav-toggle ${menuOpen ? 'open' : ''}`}
            type="button"
            aria-label="Toggle navigation menu"
            aria-controls="primary-menu"
            aria-expanded={menuOpen}
            onClick={toggleMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  )
}
