import { useMemo, useState } from 'react'
import NavBar from './components/NavBar'
import HeroSection, { initialCode } from './components/HeroSection'
import AboutSection from './components/AboutSection'
import SkillsSection from './components/SkillsSection'
import ProjectsSection from './components/ProjectsSection'
import ExperienceSection from './components/ExperienceSection'
import EducationSection from './components/EducationSection'
import ContactSection from './components/ContactSection'
import AppFooter from './components/AppFooter'
import AiChatbot from './components/AiChatbot'

function App() {
  const [codeText, setCodeText] = useState(initialCode)

  /** Parses the hero's live code editor into the data shown in the About section. */
  const developerData = useMemo(() => {
    const text = codeText
    const stackMatch = text.match(/stack:\s*\[([^\]]*)\]/)
    const availableMatch = text.match(/available:\s*(true|false)/)
    let stack = ['Vue', 'JavaScript', 'REST APIs', 'HTML', 'CSS']
    if (stackMatch) {
      const items = stackMatch[1].match(/['"]([^'"]*)['"]/g)
      stack = items ? items.map((s) => s.slice(1, -1)) : stack
    }
    return {
      stack: stack.length ? stack : ['Vue', 'JavaScript', 'REST APIs', 'HTML', 'CSS'],
      available: availableMatch ? availableMatch[1] === 'true' : true
    }
  }, [codeText])

  return (
    <div className="portfolio">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <NavBar />
      <main id="main-content">
        <HeroSection code={codeText} onCodeChange={setCodeText} />
        <AboutSection developerData={developerData} />
        <SkillsSection />
        <ProjectsSection />
        <ExperienceSection />
        <EducationSection />
        <ContactSection />
      </main>
      <AppFooter />
      <AiChatbot />
    </div>
  )
}

export default App
