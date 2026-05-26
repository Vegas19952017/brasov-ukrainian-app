import { useLocation } from 'react-router-dom';
import { useStore } from '../../store';

function routeClass(pathname: string): string {
  if (pathname === '/') return 'aurora-home';
  if (pathname.startsWith('/category')) return 'aurora-category';
  if (pathname.match(/^\/listing\/[^/]+\/edit/)) return 'aurora-form';
  if (pathname.startsWith('/listing')) return 'aurora-detail';
  if (pathname.startsWith('/cabinet')) return 'aurora-cabinet';
  if (pathname.startsWith('/chat')) return 'aurora-chat';
  if (pathname.startsWith('/admin')) return 'aurora-admin';
  if (pathname.startsWith('/add')) return 'aurora-form';
  if (pathname.startsWith('/map')) return 'aurora-map';
  return 'aurora-home';
}

export default function PageBackground() {
  const location = useLocation();
  const { heroExpanded } = useStore();
  const isHome = location.pathname === '/';

  // Keep background hidden during the full-screen hero intro
  if (isHome && !heroExpanded) return null;

  return <div className={`aurora-bg ${routeClass(location.pathname)}`} />;
}
