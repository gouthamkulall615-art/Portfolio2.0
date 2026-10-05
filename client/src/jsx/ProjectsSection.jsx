import { ProjectsStickyScroll } from './StickyProjectCards';
import synccanvasImg from '../assets/synccanvas landing page.webp';
import cryptoImg from '../assets/crypto landing page 2.webp';
import interiqImg from '../assets/interiq landing page.webp';
import taskifyImg from '../assets/taskify landing page.webp';
import '../css/ProjectsSection.css';

const projects = [
  {
    id: 1,
    title: 'SyncCanvas',
    description: 'A real-time collaborative drawing and whiteboard application.',
    image: synccanvasImg,
    demoUrl: 'https://sync-canvas-three.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/SyncCanvas',
    stack: ['REACT', 'REACT KONVA', 'MONGODB', 'EXPRESS', 'WEBSOCKETS'],
  },
  {
    id: 2,
    title: 'Crypto Tracker',
    description: 'Real-time cryptocurrency prices and market data, built with React and the CoinGecko API.',
    image: cryptoImg,
    demoUrl: 'https://coinpulse-beryl.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/Crypto-price-website',
    stack: ['REACT', 'TAILWIND CSS', 'COINGECKO API'],
  },
  {
    id: 3,
    title: 'InteriQ',
    description: 'An interior design platform with intelligent recommendations.',
    image: interiqImg,
    demoUrl: 'https://intern-iq-omega.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/InternIQ',
    stack: ['MERN STACK', 'GEMINI API'],
  },
  {
    id: 4,
    title: 'Taskify',
    description: 'A simple drag-and-drop task management PWA with column-based organization.',
    image: taskifyImg,
    demoUrl: 'https://taskify-self-five.vercel.app/',
    githubUrl: 'https://github.com/gouthamkulall615-art/TASKIFY',
    stack: ['HTML', 'CSS', 'JAVASCRIPT'],
  },
];

export default function ProjectsSection() {
  return (
    <section id="projects" className="projects-section">
      <div className="section-watermark-heading">
        <span className="watermark-bg" aria-hidden="true">PROJECTS</span>
        <h2 className="watermark-fg">PROJECTS</h2>
      </div>

      {/* Sticky pinned stacked project cards with Lenis smooth scrolling */}
      <ProjectsStickyScroll projects={projects} />
    </section>
  );
}