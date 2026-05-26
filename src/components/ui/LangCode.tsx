import { cn } from '../../lib/utils';
import type { Language } from '../../types';

const STYLES: Record<Language, string> = {
  uk: 'bg-sky-500/20 text-sky-300 border-sky-400/35',
  ro: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/35',
  en: 'bg-violet-500/20 text-violet-300 border-violet-400/35',
};

interface Props {
  code: Language;
  size?: 'sm' | 'md';
  className?: string;
}

export default function LangCode({ code, size = 'sm', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-display font-bold uppercase tracking-wider border rounded-lg',
        STYLES[code],
        size === 'sm' ? 'text-[10px] min-w-[28px] h-6 px-1.5' : 'text-xs min-w-[32px] h-7 px-2',
        className
      )}
    >
      {code}
    </span>
  );
}
