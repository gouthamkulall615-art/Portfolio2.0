import ScrollStack, { ScrollStackItem } from './ScrollStack';
import synccanvasImg from '../assets/synccanvas landing page.png';
import cryptoImg from '../assets/crypto landing page 2.png';
import interiqImg from '../assets/interiq landing page.png';
import taskifyImg from '../assets/taskify landing page.png';
import './ProjectsSection.css';

const projects = [
  {
    title: 'SyncCanvas',
    description: 'A real-time collaborative drawing and whiteboard application.',
    image: synccanvasImg,
  },
  {
    title: 'Crypto Landing Page',
    description: 'A modern cryptocurrency landing page with sleek UI.',
    image: cryptoImg,
  },
  {
    title: 'InteriQ',
    description: 'An interior design platform with intelligent recommendations.',
    image: interiqImg,
  },
  {
    title: 'Taskify',
    description: 'A productivity-first task management application.',
    image: taskifyImg,
  },
];

export default function ProjectsSection() {
  return (
    <section id="projects" className="projects-section">
      <h2 className="projects-heading">Projects</h2>

      <ScrollStack
        itemDistance={80}
        itemScale={0.04}
        itemStackDistance={28}
        stackPosition="25%"
        scaleEndPosition="12%"
        baseScale={0.88}
        scaleDuration={0.5}
        blurAmount={2}
        useWindowScroll
      >
        {projects.map((project) => (
          <ScrollStackItem key={project.title}>
            <div className="project-card-inner">
              <img
                className="project-card-img"
                src={project.image}
                alt={project.title}
                loading="lazy"
              />
              <div className="project-card-overlay">
                <h3 className="project-card-title">{project.title}</h3>
                <p className="project-card-desc">{project.description}</p>
              </div>
            </div>
          </ScrollStackItem>
        ))}
      </ScrollStack>
    </section>
  );
}
