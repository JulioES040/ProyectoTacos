import { FiClock } from 'react-icons/fi';
import { AppSidebar } from './app-sidebar';

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return <main className="coming-soon-shell"><AppSidebar /><section className="coming-soon-content"><span className="coming-soon-icon"><FiClock size={34} /></span><p>Proximamente</p><h1>{title}</h1><span>{description}</span><small>Estamos preparando esta funcionalidad para El Buen Taco.</small></section></main>;
}
