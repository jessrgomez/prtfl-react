import { useEffect, useState } from 'react'
import type { Project } from '../data/projects'

interface Props {
  project: Project | null
  onClose: () => void
}

export default function ProjectModal({ project, onClose }: Props) {
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    setActiveImage(0)
  }, [project])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.classList.toggle('modal-open', !!project)
    if (project) {
      window.addEventListener('keydown', handleKeydown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeydown)
      document.body.classList.remove('modal-open')
    }
  }, [project, onClose])

  if (!project || !project.images) return null

  return (
    <div
      className="project-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="project-modal" role="dialog" aria-modal="true" aria-label={`${project.title} case study`}>
        <button type="button" className="project-modal-close" aria-label="Close case study" onClick={onClose}>
          ✕
        </button>
        <div className="project-modal-media">
          <img src={project.images[activeImage]} alt={`${project.title} screenshot`} loading="lazy" />
          {project.images.length > 1 && (
            <div className="project-modal-thumbs">
              {project.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  className={`project-modal-thumb ${i === activeImage ? 'active' : ''}`}
                  aria-label={`Show screenshot ${i + 1}`}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="project-modal-body">
          <span className="project-industry project-modal-industry">{project.industries.join(' / ')}</span>
          <h3>{project.title}</h3>
          <p className="project-company">{project.company}</p>
          <p>{project.description}</p>
          <div className="project-tech">
            {project.tech.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
          <p className="project-details-label">Key contribution</p>
          <div className="project-details">
            <ul>
              {project.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
