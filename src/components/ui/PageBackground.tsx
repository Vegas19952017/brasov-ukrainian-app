import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';

interface OrbConfig {
  size: number;
  color: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  dx: number[];
  dy: number[];
  duration: number;
  blur?: number;
}

function Orb({ size, color, top, left, right, bottom, dx, dy, duration, blur = 90 }: OrbConfig) {
  return (
    <motion.div
      className="fixed pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, x: dx, y: dy }}
      exit={{ opacity: 0 }}
      transition={{
        opacity: { duration: 1.2 },
        x: { duration, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' },
        y: { duration: duration * 1.1, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' },
      }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        top,
        left,
        right,
        bottom,
        zIndex: 0,
      }}
    />
  );
}

const ORB_SETS: Record<string, OrbConfig[]> = {
  home: [
    { size: 640, color: 'rgba(201,168,76,0.07)', top: '-80px', right: '-120px', dx: [0, 50, 0], dy: [0, -40, 0], duration: 22 },
    { size: 500, color: 'rgba(110,170,100,0.05)', bottom: '60px', left: '-100px', dx: [0, 30, 0], dy: [0, 50, 0], duration: 28 },
  ],
  category: [
    { size: 550, color: 'rgba(201,168,76,0.06)', top: '-60px', right: '-80px', dx: [0, 40, 0], dy: [0, -30, 0], duration: 24 },
    { size: 400, color: 'rgba(110,170,100,0.04)', bottom: '120px', left: '-60px', dx: [0, 20, 0], dy: [0, 40, 0], duration: 32 },
  ],
  detail: [
    { size: 600, color: 'rgba(201,168,76,0.065)', top: '-100px', right: '-80px', dx: [0, 35, 0], dy: [0, -25, 0], duration: 26 },
    { size: 380, color: 'rgba(180,150,80,0.04)', bottom: '200px', left: '-40px', dx: [0, 25, 0], dy: [0, 30, 0], duration: 34 },
  ],
  cabinet: [
    { size: 520, color: 'rgba(201,168,76,0.065)', top: '-70px', right: '-100px', dx: [0, 45, 0], dy: [0, -35, 0], duration: 20 },
    { size: 300, color: 'rgba(201,168,76,0.04)', bottom: '100px', right: '30%', dx: [0, -20, 0], dy: [0, 20, 0], duration: 30 },
  ],
  chat: [
    { size: 500, color: 'rgba(90,140,210,0.05)', bottom: '-60px', right: '-80px', dx: [0, -30, 0], dy: [0, -40, 0], duration: 25 },
    { size: 420, color: 'rgba(201,168,76,0.04)', top: '80px', left: '-60px', dx: [0, 30, 0], dy: [0, 25, 0], duration: 30 },
  ],
  admin: [
    { size: 580, color: 'rgba(201,168,76,0.05)', top: '-80px', right: '-100px', dx: [0, 40, 0], dy: [0, -30, 0], duration: 27 },
    { size: 350, color: 'rgba(90,140,210,0.04)', bottom: '150px', left: '-50px', dx: [0, 20, 0], dy: [0, 30, 0], duration: 35 },
  ],
  add: [
    { size: 480, color: 'rgba(201,168,76,0.06)', top: '-60px', right: '-80px', dx: [0, 35, 0], dy: [0, -25, 0], duration: 22 },
  ],
  map: [
    { size: 400, color: 'rgba(201,168,76,0.04)', top: '30px', right: '-60px', dx: [0, 20, 0], dy: [0, -15, 0], duration: 30, blur: 70 },
  ],
};

function routeKey(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/category')) return 'category';
  if (pathname.match(/^\/listing\/[^/]+\/edit/)) return 'add';
  if (pathname.startsWith('/listing')) return 'detail';
  if (pathname.startsWith('/cabinet')) return 'cabinet';
  if (pathname.startsWith('/chat')) return 'chat';
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/add')) return 'add';
  if (pathname.startsWith('/map')) return 'map';
  return 'home';
}

export default function PageBackground() {
  const location = useLocation();
  const { heroExpanded } = useStore();
  const key = routeKey(location.pathname);
  const isHome = key === 'home';

  // Don't show orbs on home page until the hero has expanded
  const orbs = (!isHome || heroExpanded) ? (ORB_SETS[key] ?? []) : [];

  return (
    <AnimatePresence>
      {orbs.map((orb, i) => (
        <Orb key={`${key}-${i}`} {...orb} />
      ))}
    </AnimatePresence>
  );
}
