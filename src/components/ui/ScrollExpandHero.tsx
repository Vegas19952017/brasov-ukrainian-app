import {
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../../store';

interface ScrollExpandHeroProps {
  bgImageSrc: string;
  mediaSrc: string;
  title?: string;
  subtitle?: string;
  scrollToExpand?: string;
  children?: ReactNode;
}

// Static particles config (generated once)
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 4,
  left: `${5 + Math.random() * 90}%`,
  bottom: `${5 + Math.random() * 40}%`,
  duration: `${4 + Math.random() * 6}s`,
  delay: `${Math.random() * 6}s`,
  color: i % 3 === 0
    ? 'rgba(234,179,8,0.5)'
    : i % 3 === 1
      ? 'rgba(37,99,235,0.5)'
      : 'rgba(255,255,255,0.25)',
}));

export default function ScrollExpandHero({
  bgImageSrc,
  mediaSrc,
  title = 'Брашов Український',
  subtitle = 'Сервіси · Оголошення · Спільнота',
  scrollToExpand = 'Гортайте вниз, щоб відкрити',
  children,
}: ScrollExpandHeroProps) {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const { setHeroExpanded } = useStore();
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        setHeroExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.001;
        const newProgress = Math.min(Math.max(scrollProgress + scrollDelta, 0), 1);
        setScrollProgress(newProgress);
        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
          setHeroExpanded(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartY) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        setHeroExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005;
        const newProgress = Math.min(Math.max(scrollProgress + deltaY * scrollFactor, 0), 1);
        setScrollProgress(newProgress);
        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
          setHeroExpanded(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = () => setTouchStartY(0);
    const handleScroll = () => { if (!mediaFullyExpanded) window.scrollTo(0, 0); };

    window.addEventListener('wheel', handleWheel as unknown as EventListener, { passive: false });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchstart', handleTouchStart as unknown as EventListener, { passive: false });
    window.addEventListener('touchmove', handleTouchMove as unknown as EventListener, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel as unknown as EventListener);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart as unknown as EventListener);
      window.removeEventListener('touchmove', handleTouchMove as unknown as EventListener);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY, setHeroExpanded]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const mediaWidth  = 280 + scrollProgress * (isMobile ? 600 : 1100);
  const mediaHeight = 340 + scrollProgress * (isMobile ? 180 : 360);
  const textShift   = scrollProgress * (isMobile ? 150 : 125);

  const firstWord   = title.split(' ')[0];
  const restOfTitle = title.split(' ').slice(1).join(' ');

  return (
    <div ref={sectionRef} className="overflow-x-hidden">
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">

          {/* ── Background image with gradient overlays ── */}
          <motion.div
            className="absolute inset-0 z-0 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress * 1.3 }}
            transition={{ duration: 0.08 }}
          >
            <img
              src={bgImageSrc}
              alt="Брашов фон"
              className="w-full h-full object-cover object-center"
            />
            {/* Obsidian gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian/75 via-obsidian/35 to-obsidian/92" />
            {/* Royal blue atmosphere */}
            <div className="absolute inset-0 bg-gradient-to-tr from-royal/12 via-transparent to-transparent" />
            {/* Amber warm accent at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber/6 to-transparent" />
          </motion.div>

          {/* ── Floating particles ── */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {PARTICLES.map((p) => (
              <span
                key={p.id}
                className="hero-particle"
                style={{
                  width: p.size,
                  height: p.size,
                  left: p.left,
                  bottom: p.bottom,
                  background: p.color,
                  animationDuration: p.duration,
                  animationDelay: p.delay,
                  opacity: 1 - scrollProgress,
                }}
              />
            ))}
          </div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">

              {/* ── Ambient orb glow behind card ── */}
              <div
                className="hero-orb absolute z-0 rounded-full pointer-events-none"
                style={{
                  width: mediaWidth * 0.6,
                  height: mediaHeight * 0.6,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.6 + scrollProgress * 0.4,
                  transition: 'width 0.1s, height 0.1s',
                  background: 'transparent',
                }}
              />

              {/* ── Expanding media card ── */}
              <div
                className="card-shimmer absolute z-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl overflow-hidden"
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  boxShadow: [
                    `0 0 ${24 + scrollProgress * 70}px rgba(37,99,235,${0.12 + scrollProgress * 0.22})`,
                    `0 0 ${50 + scrollProgress * 120}px rgba(37,99,235,${0.06 + scrollProgress * 0.12})`,
                    `0 32px 80px rgba(0,0,0,${0.4 + scrollProgress * 0.25})`,
                    `0 0 0 1px rgba(255,255,255,${0.04 + scrollProgress * 0.04})`,
                  ].join(', '),
                }}
              >
                <img
                  src={mediaSrc}
                  alt="Брашов панорама"
                  className="w-full h-full object-cover"
                />
                {/* Dark glassmorphic overlay fades as card expands */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(145deg,
                      rgba(37,99,235,${0.32 - scrollProgress * 0.28}) 0%,
                      rgba(9,10,15,${0.48 - scrollProgress * 0.38}) 100%)`,
                  }}
                />
                {/* Subtle inner amber glow */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    boxShadow: `inset 0 0 ${50 + scrollProgress * 80}px rgba(234,179,8,${0.03 + scrollProgress * 0.07})`,
                  }}
                />
                {/* Top edge highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </div>

              {/* ── Animated title — words fly apart on scroll ── */}
              <div className="flex flex-col items-center justify-center gap-1 relative z-10 pointer-events-none select-none px-4">
                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-tight"
                  style={{
                    transform: `translateX(-${textShift}vw)`,
                    textShadow: `0 2px 40px rgba(37,99,235,${0.5 + scrollProgress * 0.3})`,
                  }}
                >
                  {firstWord}
                </motion.h1>

                <motion.h1
                  className="hero-title-gold text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight"
                  style={{ transform: `translateX(${textShift}vw)` }}
                >
                  {restOfTitle}
                </motion.h1>

                {/* Subtitle fades out quickly */}
                <motion.p
                  className="text-xs text-white/50 font-semibold mt-2 tracking-[0.2em] uppercase"
                  animate={{
                    opacity: Math.max(0, 1 - scrollProgress * 4),
                    y: scrollProgress * -12,
                  }}
                  transition={{ duration: 0.05 }}
                >
                  {subtitle}
                </motion.p>
              </div>

              {/* ── Scroll hint with animated bounce ── */}
              <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
                animate={{ opacity: scrollProgress > 0.08 ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-[10px] text-amber/60 font-semibold tracking-[0.2em] uppercase">
                  {scrollToExpand}
                </span>
                <div className="scroll-hint-bounce">
                  <ChevronDown size={20} className="text-amber/50" />
                </div>
              </motion.div>

            </div>

            {/* ── Revealed content after full expansion ── */}
            <motion.section
              className="flex flex-col w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
}
