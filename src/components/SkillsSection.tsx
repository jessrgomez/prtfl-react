import { useAnimateOnScroll } from '../composables/useAnimateOnScroll'

const skillGroups = [
  {
    title: 'Frontend',
    items: ['VueJS (Vue2 & Vue3)', 'Composition API', 'ReactJS', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'BootstrapVue', 'TailwindCSS', 'Material UI', 'Highcharts', 'Storybook', 'WebSocket', 'NPM', 'Vite']
  },
  {
    title: 'Backend & Integration',
    items: ['REST APIs', 'Axios', 'Pinia', 'TanStack Query', 'NodeJS', 'ExpressJS', 'PHP', 'MySQL']
  },
  {
    title: 'Tools',
    items: ['Git', 'GitHub', 'GitLab', 'Bitbucket', 'Huawei Cloud', 'Swagger', 'Jira', 'Trello', 'SourceTree', 'Figma', 'Postman', 'VS Code', 'AutoPub', 'Meegle']
  },
  {
    title: 'AI Proficiency',
    items: ['Claude AI', 'Cursor AI', 'Prompt Engineering', 'AI-Assisted Development', 'AI Pair Programming']
  },
  {
    title: 'Professional Skills',
    items: ['Project Coordination', 'Requirement Gathering', 'Client Communication', 'UAT Testing', 'FAT Testing', 'Documentation Management', 'Agile Methodologies']
  }
]

export default function SkillsSection() {
  const { target, isVisible } = useAnimateOnScroll<HTMLElement>()

  return (
    <section id="skills" ref={target} className={`section skills ${isVisible ? 'animate-in' : ''}`}>
      <h2 className="section-title">
        <span className="title-num">02.</span> Technical Skills
      </h2>
      <div className="skills-groups">
        {skillGroups.map((group) => (
          <div key={group.title} className="skill-group">
            <h3 className="skill-group-title">{group.title}</h3>
            <div className="skill-tags">
              {group.items.map((item) => (
                <span key={item} className="skill-tag">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
