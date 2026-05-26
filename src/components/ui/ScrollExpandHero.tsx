import {
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from 'framer-motion';
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

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 2 + Math.random() * 4,
  left: `${5 + Math.random() * 90}%`,
  bottom: `${5 + Math.random() * 40}%`,
  duration: `${4 + Math.random() * 6}s`,
  delay: `${Math.random() * 6}s`,
  color:
    i % 3 === 0
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
  const [showContent, setShowContent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { setHeroExpanded } = useStore();

  // Refs to avoid stale closures — never trigger re-renders
  const expandedRef = useRef(false);
  const touchStartYRef = useRef(0);
  const isMobileRef = useRef(false);

  // Raw target progress + spring for butter-smooth animation
  const rawProgress = useMotionValue(0);
  const springProgress = useSpring(rawProgress, {
    stiffness: 115,
    damping: 23,
    mass: 0.5,
    restDelta: 0.001,
  });

  // ── Derived motion values (computed every animation frame, zero React renders) ──
  const mediaWidth = useTransform(springProgress, (p) =>
    `${Math.round(280 + p * (isMobileRef.current ? 600 : 1100))}px`,
  );
  const mediaHeight = useTransform(springProgress, (p) =>
    `${Math.round(340 + p * (isMobileRef.current ? 180 : 360))}px`,
  );
  const orbWidth = useTransform(springProgress, (p) =>
    `${Math.round((280 + p * (isMobileRef.current ? 600 : 1100)) * 0.6)}px`,
  );
  const orbHeight = useTransform(springProgress, (p) =>
    `${Math.round((340 + p * (isMobileRef.current ? 180 : 360)) * 0.6)}px`,
  );

  const bgOpacity = useTransform(springProgress, (p) =>
    Math.max(0, 1 - p * 1.3),
  );
  // Subtle background parallax — scale up as card expands
  const bgScale = useTransform(springProgress, [0, 1], [1, 1.06]);

  const particleOpacity = useTransform(springProgress, (p) =>
    Math.max(0, 1 - p),
  );
  const orbOpacity = useTransform(springProgress, (p) => 0.6 + p * 0.4);

  // Card border-radius animates to 0 as it fills the screen
  const cardBorderRadius = useTransform(
    springProgress,
    [0, 0.82, 1],
    [24, 8, 0],
  );

  const subtitleOpacity = useTransform(springProgress, [0, 0.22], [1, 0]);
  const subtitleY = useTransform(springProgress, [0, 0.22], [0, -14]);
  const hintOpacity = useTransform(springProgress, [0, 0.09], [1, 0]);

  // Title words fly apart — use CSS transform string for vw units
  const textTransformLeft = useTransform(
    springProgress,
    (p) => `translateX(-${p * (isMobileRef.current ? 150 : 125)}vw)`,
  );
  const textTransformRight = useTransform(
    springProgress,
    (p) => `translateX(${p * (isMobileRef.current ? 150 : 125)}vw)`,
  );
  const textShadow = useTransform(
    springProgress,
    (p) => `0 2px 40px rgba(37,99,235,${0.5 + p * 0.3})`,
  );

  const cardBoxShadow = useTransform(springProgress, (p) =>
    [
      `0 0 ${24 + p * 70}px rgba(37,99,235,${0.12 + p * 0.22})`,
      `0 0 ${50 + p * 120}px rgba(37,99,235,${0.06 + p * 0.12})`,
      `0 32px 80px rgba(0,0,0,${0.4 + p * 0.25})`,
      `0 0 0 1px rgba(255,255,255,${0.04 + p * 0.04})`,
    ].join(', '),
  );
  const cardOverlayBg = useTransform(
    springProgress,
    (p) =>
      `linear-gradient(145deg, rgba(37,99,235,${0.32 - p * 0.28}) 0%, rgba(9,10,15,${0.48 - p * 0.38}) 100%)`,
  );
  const cardInnerGlow = useTransform(
    springProgress,
    (p) =>
      `inset 0 0 ${50 + p * 80}px rgba(234,179,8,${0.03 + p * 0.07})`,
  );

  // Threshold callbacks — no stale closure risk because expandedRef is a ref
  useMotionValueEvent(springProgress, 'change', (v) => {
    if (v >= 0.98 && !expandedRef.current) {
      expandedRef.current = true;
      rawProgress.set(1);
      setShowContent(true);
      setHeroExpanded(true);
    } else if (v < 0.75) {
      setShowContent(false);
    }
  });

  // Event listeners registered ONCE — all closure state lives in refs
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (expandedRef.current && e.deltaY < 0 && window.scrollY <= 5) {
        expandedRef.current = false;
        setHeroExpanded(false);
        rawProgress.set(0);
        e.preventDefault();
        return;
      }
      if (!expandedRef.current) {
        e.preventDefault();
        const next = Math.min(Math.max(rawProgress.get() + e.deltaY * 0.0012, 0), 1);
        rawProgress.set(next);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartYRef.current) return;
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - touchY;

      if (expandedRef.current && deltaY < -20 && window.scrollY <= 5) {
        expandedRef.current = false;
        setHeroExpanded(false);
        rawProgress.set(0);
        e.preventDefault();
        return;
      }
      if (!expandedRef.current) {
        e.preventDefault();
        const next = Math.min(Math.max(rawProgress.get() + deltaY * 0.006, 0), 1);
        rawProgress.set(next);
        touchStartYRef.current = touchY;
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = 0;
    };

    const handleScroll = () => {
      if (!expandedRef.current) window.scrollTo(0, 0);
    };

    window.addEventListener('wheel', handleWheel as unknown as EventListener, {
      passive: false,
    });
    window.addEventListener('scroll', handleScroll);
    window.addEventListener(
      'touchstart',
      handleTouchStart as unknown as EventListener,
      { passive: false },
    );
    window.addEventListener(
      'touchmove',
      handleTouchMove as unknown as EventListener,
      { passive: false },
    );
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('wheel', handleWheel as unknown as EventListener);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener(
        'touchstart',
        handleTouchStart as unknown as EventListener,
      );
      window.removeEventListener(
        'touchmove',
        handleTouchMove as unknown as EventListener,
      );
      window.removeEventListener('touchend', handleTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — all state accessed via refs

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      isMobileRef.current = mobile;
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const firstWord = title.split(' ')[0];
  const restOfTitle = title.split(' ').slice(1).join(' ');

  return (
    <div className="overflow-x-hidden">
      <section className="relative flex flex-col items-center justify-start min-h-[100dvh]">
        <div className="relative w-full flex flex-col items-center min-h-[100dvh]">

          {/* ── Background image with parallax scale ── */}
          <motion.div
            className="absolute inset-0 z-0 h-full overflow-hidden"
            style={{ opacity: bgOpacity }}
          >
            <motion.img
              src={bgImageSrc}
              alt="Брашов фон"
              className="w-full h-full object-cover object-center"
              style={{
                scale: bgScale,
                willChange: 'transform, opacity',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-obsidian/75 via-obsidian/35 to-obsidian/92" />
            <div className="absolute inset-0 bg-gradient-to-tr from-royal/12 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-amber/6 to-transparent" />
          </motion.div>

          {/* ── Floating particles ── */}
          <motion.div
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ opacity: particleOpacity }}
          >
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
                }}
              />
            ))}
          </motion.div>

          <div className="container mx-auto flex flex-col items-center justify-start relative z-10">
            <div className="flex flex-col items-center justify-center w-full h-[100dvh] relative">

              {/* ── Ambient orb glow ── */}
              <motion.div
                className="hero-orb absolute z-0 rounded-full pointer-events-none"
                style={{
                  width: orbWidth,
                  height: orbHeight,
                  top: '50%',
                  left: '50%',
                  translateX: '-50%',
                  translateY: '-50%',
                  opacity: orbOpacity,
                  background: 'transparent',
                  willChange: 'width, height',
                }}
              />

              {/* ── Expanding media card ── */}
              <motion.div
                className="card-shimmer absolute z-0 top-1/2 left-1/2 overflow-hidden"
                style={{
                  width: mediaWidth,
                  height: mediaHeight,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  translateX: '-50%',
                  translateY: '-50%',
                  borderRadius: cardBorderRadius,
                  boxShadow: cardBoxShadow,
                  willChange: 'width, height, border-radius, box-shadow',
                }}
              >
                <img
                  src={mediaSrc}
                  alt="Брашов панорама"
                  className="w-full h-full object-cover"
                />
                <motion.div
                  className="absolute inset-0"
                  style={{ background: cardOverlayBg }}
                />
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  style={{ boxShadow: cardInnerGlow }}
                />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </motion.div>

              {/* ── Title words fly apart on scroll ── */}
              <div className="flex flex-col items-center justify-center gap-1 relative z-10 pointer-events-none select-none px-4">
                <motion.h1
                  className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-tight"
                  style={{
                    transform: textTransformLeft,
                    textShadow,
                    willChange: 'transform',
                  }}
                >
                  {firstWord}
                </motion.h1>

                <motion.h1
                  className="hero-title-gold text-4xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight"
                  style={{
                    transform: textTransformRight,
                    willChange: 'transform',
                  }}
                >
                  {restOfTitle}
                </motion.h1>

                <motion.p
                  className="text-xs text-white/50 font-semibold mt-2 tracking-[0.2em] uppercase"
                  style={{
                    opacity: subtitleOpacity,
                    y: subtitleY,
                  }}
                >
                  {subtitle}
                </motion.p>
              </div>

              {/* ── Scroll hint ── */}
              <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10"
                style={{ opacity: hintOpacity }}
              >
                <span className="text-[10px] text-amber/60 font-semibold tracking-[0.2em] uppercase">
                  {scrollToExpand}
                </span>
                <div className="scroll-hint-bounce">
                  <ChevronDown size={20} className="text-amber/50" />
                </div>
              </motion.div>

            </div>

            {/* ── Revealed catalog content ── */}
            <motion.section
              className="flex flex-col w-full"
              initial={{ opacity: 0, y: 24 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
}
