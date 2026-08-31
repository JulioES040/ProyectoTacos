import Link from 'next/link';
import { FiArrowLeft, FiPackage } from 'react-icons/fi';

export default function NotFound() {
  return <main className="not-found-shell"><section><span><FiPackage size={44} /></span><p>Error 404</p><h1>Pagina no encontrada</h1><strong>Estamos preparando esta funcionalidad.</strong><small>La pagina que buscas aun no esta disponible o ya no existe.</small><Link href="/pos"><FiArrowLeft size={18} /> Volver al POS</Link></section></main>;
}
