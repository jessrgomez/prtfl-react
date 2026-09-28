import { useAnimateOnScroll } from '../composables/useAnimateOnScroll'

const certifications = [
  'Data Privacy Compliance',
  'AWS Summit Online',
  'AWS Data, Database and Analytics',
  'Advanced SEO',
  'CSS Processor and Web Security Measures'
]

const languages = ['English', 'Filipino']

export default function EducationSection() {
  const { target, isVisible } = useAnimateOnScroll<HTMLElement>()

  return (
    <section id="education" ref={target} className={`section education ${isVisible ? 'animate-in' : ''}`}>
      <h2 className="section-title">
        <span className="title-num">05.</span> Education
      </h2>
      <div className="education-grid">
        <div className="education-card">
          <h3>Bachelor of Science in Information Technology</h3>
          <p className="education-major">Major in Web Development</p>
          <p className="timeline-company">Holy Angel University</p>
          <div className="timeline-header">
            <span className="timeline-period">2014 - 2018</span>
            <span className="skill-tag">Dean's Lister (2018)</span>
          </div>
        </div>

        <div className="education-card">
          <h3 className="subsection-title subsection-title--tight">Certifications</h3>
          <ul className="plain-list">
            {certifications.map((cert) => (
              <li key={cert}>{cert}</li>
            ))}
          </ul>
        </div>

        <div className="education-card">
          <h3 className="subsection-title subsection-title--tight">Languages</h3>
          <div className="skill-tags">
            {languages.map((lang) => (
              <span key={lang} className="skill-tag">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
