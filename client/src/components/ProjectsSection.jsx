import { ExternalLink } from 'lucide-react';
import ScrollStack, { ScrollStackItem } from './ScrollStack';
import synccanvasImg from '../assets/synccanvas landing page.png';
import cryptoImg from '../assets/crypto landing page 2.png';
import interiqImg from '../assets/interiq landing page.png';
import taskifyImg from '../assets/taskify landing page.png';
import './ProjectsSection.css';

const GithubIcon = ({ size = 18, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const projects = [
  {
    title: 'SyncCanvas',
    description: 'A real-time collaborative drawing and whiteboard application.',
    image: synccanvasImg,
    liveUrl: 'https://sync-canvas-three.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/SyncCanvas',
  },
  {
    title: 'Crypto Landing Page',
    description: 'A modern cryptocurrency landing page with sleek UI.',
    image: cryptoImg,
    liveUrl: 'https://coinpulse-beryl.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/Crypto-price-website',
  },
  {
    title: 'InteriQ',
    description: 'An interior design platform with intelligent recommendations.',
    image: interiqImg,
    liveUrl: 'https://intern-iq-omega.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/InternIQ',
  },
  {
    title: 'Taskify',
    description: 'A productivity-first task management application.',
    image: taskifyImg,
    liveUrl: 'https://taskify-self-five.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/TASKIFY',
  },
];

export default function ProjectsSection() {
  return (
    <section id="projects" className="projects-section">
      <h2 className="projects-heading">Projects</h2>

      <ScrollStack useWindowScroll>
        {projects.map((project) => (
          <ScrollStackItem key={project.title}>
            <div className="project-card-inner">
              <img
                className="project-card-img"
                src={project.image}
                alt={project.title}
                loading="lazy"
              />

              {/* Floating Top-Right Action Pill */}
              <div className="project-card-floating-actions">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-action-btn github"
                    title="View Source on GitHub"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GithubIcon size={17} />
                    <span className="action-btn-text">GitHub</span>
                  </a>
                )}
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-action-btn live"
                    title="Open Live Website"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={16} />
                    <span className="action-btn-text">Live Demo</span>
                  </a>
                )}
              </div>

              {/* Bottom Details Overlay */}
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