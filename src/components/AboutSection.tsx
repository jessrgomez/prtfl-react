import DeveloperScene from './DeveloperScene'
import { useAnimateOnScroll } from '../composables/useAnimateOnScroll'

interface DeveloperData {
  stack: string[]
  available: boolean
}

interface Props {
  developerData: DeveloperData
}

const aboutParagraphs = [
  'Frontend Developer with 8 years of professional experience building responsive and scalable web applications across Aviation, Travel and Tours, Enterprise, and Gaming Industries.',
  'Experienced in delivering production-ready solutions while maintaining a strong focus on user experience, performance, and business objectives. Skilled in frontend development, API integrations, project coordination, and technical documentation throughout the software development lifecycle.',
  'Proven ability to collaborate with cross-functional teams, translate complex business requirements into reliable digital solutions, and deliver high-quality applications in fast-paced environments.',
  'Recognized for adaptability, problem-solving, and maintaining high standards of quality while balancing both technical and business priorities.'
]

export default function AboutSection({ developerData }: Props) {
  const { target, isVisible } = useAnimateOnScroll<HTMLElement>()

  return (
    <section id="about" ref={target} className={`section about ${isVisible ? 'animate-in' : ''}`}>
      <h2 className="section-title">
        <span className="title-num">01.</span> Professional Summary
      </h2>
      <div className="about-grid">
        <div className="about-text">
          {aboutParagraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
          <p className="about-availability">
            <span className={`status-dot ${!developerData.available ? 'status-dot--off' : ''}`}></span>
            {developerData.available ? 'Open to new opportunities' : 'Currently not taking new projects'}
          </p>
        </div>
        <div className="about-visual">{isVisible && <DeveloperScene stack={developerData.stack} />}</div>
      </div>
    </section>
  )
}
