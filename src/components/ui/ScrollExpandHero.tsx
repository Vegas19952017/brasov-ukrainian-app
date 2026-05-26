import { useEffect, useRef, useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useStore } from '../../store';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4';

interface ScrollExpandHeroProps {
  title?: string;
  subtitle?: string;
  scrollToExpand?: string;
  children?: ReactNode;
  bgImageSrc?: string;
  mediaSrc?: string;
}

export default function ScrollExpandHero({
  subtitle = 'Сервіси · Оголошення · Спільнота',
  scrollToExpand = 'Гортайте вниз, щоб відкрити',
  children,
}: ScrollExpandHeroProps) {
  const { setHeroExpanded } = useStore();
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef   = useRef<number>(0);

  // Looping video with manual fade in / fade out via requestAnimationFrame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const tick = () => {
      if (video.duration && video.readyState >= 2) {
        const t = video.currentTime;
        const d = video.duration;
        if (t < 0.5) {
          video.style.opacity = String(t / 0.5);
        } else if (t > d - 0.5) {
          video.style.opacity = String((d - t) / 0.5);
        } else {
          video.style.opacity = '1';
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    const handleEnded = () => {
      video.style.opacity = '0';
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
      }, 100);
    };

    video.style.opacity = '0';
    rafRef.current = requestAnimationFrame(tick);
    video.addEventListener('ended', handleEnded);
    video.play().catch(() => {});

    return () => {
      cancelAnimationFrame(rafRef.current);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Scroll / touch expand
  useEffect(() => {
    const threshold = window.innerWidth < 768 ? 55 : 75;
    let touchStartY = 0;

    const expand = () => {
      if (expanded) return;
      setExpanded(true);
      setHeroExpanded(true);
    };

    const onWheel     = (e: WheelEvent)     => { if (e.deltaY > threshold) expand(); };
    const onTouchStart= (e: TouchEvent)     => { touchStartY = e.touches[0].clientY; };
    const onTouchEnd  = (e: TouchEvent)     => { if (touchStartY - e.changedTouches[0].clientY > threshold) expand(); };

    if (!expanded) {
      window.addEventListener('wheel',      onWheel,      { passive: true });
      window.addEventListener('touchstart', onTouchStart, { passive: true });
      window.addEventListener('touchend',   onTouchEnd,   { passive: true });
    }
    return () => {
      window.removeEventListener('wheel',      onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend',   onTouchEnd);
    };
  }, [expanded, setHeroExpanded]);

  if (expanded) {
    return (
      <div className="min-h-screen bg-white animate-fade-in">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white">

      {/* Video layer */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          muted
          playsInline
          preload="auto"
          style={{
            position: 'absolute',
            inset: 'auto 0 0 0',
            top: '300px',
            width: '100%',
            height: 'calc(100% - 300px)',
            objectFit: 'cover',
            opacity: 0,
            willChange: 'opacity',
          }}
        />
        {/* Gradient overlays over video */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom, #ffffff 0%, rgba(255,255,255,0.55) 28%, rgba(255,255,255,0.05) 52%, rgba(255,255,255,0.45) 78%, #ffffff 100%)',
          }}
        />
      </div>

      {/* Hero content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 min-h-screen"
        style={{ paddingTop: 'calc(8rem - 75px)', paddingBottom: '8rem' }}
      >
        {/* Headline */}
        <h1
          className="animate-fade-rise font-serif font-normal text-black"
          style={{
            fontSize: 'clamp(2.8rem, 9vw, 5.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            maxWidth: '16ch',
          }}
        >
          Брашов{' '}
          <em className="not-italic" style={{ color: '#6F6F6F' }}>
            Українськийй.
          </em>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-rise-delay mt-8 max-w-sm leading-relaxed"
          style={{ color: '#6F6F6F', fontSize: '1rem' }}
        >
          {subtitle}
          <br />
          <span style={{ fontSize: '0.875rem' }}>
            Спільнота українців у Брашові — знайди сервіс, оголошення або земляка.
          </span>
        </p>

        {/* CTA */}
        <button
          onClick={() => { setExpanded(true); setHeroExpanded(true); }}
          className="animate-fade-rise-delay-2 btn-primary mt-12"
          style={{ paddingLeft: '3.5rem', paddingRight: '3.5rem', paddingTop: '1.1rem', paddingBottom: '1.1rem', fontSize: '1rem' }}
        >
          Відкрити додаток
        </button>

        {/* Scroll hint */}
        <div
          className="animate-fade-rise-delay-2 absolute bottom-10 left-0 right-0 flex flex-col items-center gap-1.5"
          style={{ color: '#9CA3AF' }}
        >
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {scrollToExpand}
          </span>
          <ChevronDown size={15} className="animate-bounce" />
        </div>
      </div>
    </div>
  );
}
