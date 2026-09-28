import { useMemo, useState, type MouseEvent } from 'react'
import { useAnimateOnScroll } from '../composables/useAnimateOnScroll'
import ProjectModal from './ProjectModal'
import { projects, type Project } from '../data/projects'

const industries = ['All', ...new Set(projects.flatMap((project) => project.industries))]

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function ProjectsSection() {
  const [activeIndustry, setActiveIndustry] = useState('All')
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  const filteredProjects = useMemo(
    () => (activeIndustry === 'All' ? projects : projects.filter((project) => project.industries.includes(activeIndustry))),
    [activeIndustry]
  )

  const selectIndustry = (industry: string) => {
    setActiveIndustry(industry)
    setExpandedProject(null)
  }

  const toggleProject = (title: string) => {
    setExpandedProject((current) => (current === title ? null : title))
  }

  const openCaseStudy = (project: Project) => setActiveProject(project)
  const closeCaseStudy = () => setActiveProject(null)

  const tiltCard = (event: MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion) return
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    card.style.transform = `perspective(800px) translateY(-4px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg)`
  }

  const resetTilt = (event: MouseEvent<HTMLElement>) => {
    event.currentTarget.style.transform = ''
  }

  const { target, isVisible } = useAnimateOnScroll<HTMLElement>()

  return (
    <section id="projects" ref={target} className={`section projects ${isVisible ? 'animate-in' : ''}`}>
      <h2 className="section-title">
        <span className="title-num">03.</span> Projects
      </h2>
      <div className="section-intro">
        <div>
          <p className="section-kicker">Selected work across {industries.length - 1} industries</p>
          <p>Explore the products and systems I helped deliver. Client work is described at a high level to respect confidentiality.</p>
        </div>
        <span className="project-count">
          {filteredProjects.length} project{filteredProjects.length === 1 ? '' : 's'}
        </span>
      </div>
      <div className="project-filters" aria-label="Filter projects by industry">
        {industries.map((industry) => (
          <button
            key={industry}
            type="button"
            className={activeIndustry === industry ? 'active' : ''}
            aria-pressed={activeIndustry === industry}
            onClick={() => selectIndustry(industry)}
          >
            {industry}
          </button>
        ))}
      </div>
      <div key={activeIndustry} className="projects-grid">
        {filteredProjects.map((project, i) => (
          <article
            key={project.title}
            className="project-card"
            onMouseMove={tiltCard}
            onMouseLeave={resetTilt}
            onClick={() => toggleProject(project.title)}
          >
            {project.images && (
              <button
                type="button"
                className="project-thumb"
                aria-label={`View ${project.title} case study screenshots`}
                onClick={(e) => {
                  e.stopPropagation()
                  openCaseStudy(project)
                }}
              >
                <img src={project.images[0]} alt={`${project.title} screenshot`} loading="lazy" />
                <span className="project-thumb-badge">🔍 View case study</span>
              </button>
            )}
            <div className="project-number">{String(i + 1).padStart(2, '0')}</div>
            <span className={`project-industry ${project.images ? 'project-industry--overlay' : ''}`}>
              {project.industries.join(' / ')}
            </span>
            <h3>{project.title}</h3>
            <p className="project-company">{project.company}</p>
            <p>{project.description}</p>
            <div className="project-tech">
              {project.tech.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
            <button
              className="project-details-toggle"
              type="button"
              aria-expanded={expandedProject === project.title}
              onClick={(e) => {
                e.stopPropagation()
                toggleProject(project.title)
              }}
            >
              {expandedProject === project.title ? 'Hide contribution' : 'View contribution'}
              <span aria-hidden="true">{expandedProject === project.title ? '−' : '+'}</span>
            </button>
            {expandedProject === project.title && (
              <div className="project-details">
                <p className="project-details-label">Key contribution</p>
                <ul>
                  {project.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
      <ProjectModal project={activeProject} onClose={closeCaseStudy} />
    </section>
  )
}
