import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Option {
  value: string;
  label: string;
}

interface DarkSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function DarkSelect({
  value,
  onChange,
  options,
  placeholder = 'Оберіть...',
  required,
  className,
}: DarkSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'input-glass w-full py-3 text-sm text-left flex items-center justify-between gap-2',
          !selected && 'text-white/40',
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={15}
          className={cn('text-white/40 shrink-0 transition-transform', open && 'rotate-180')}
        />
      </button>

      {/* Hidden native input for form validation */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => {}}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
        />
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-white/10 bg-[#0D0F1A] shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors',
                  opt.value === value
                    ? 'bg-lumina/15 text-lumina'
                    : 'text-white/80 hover:bg-white/8',
                )}
              >
                <span>{opt.label}</span>
                {opt.value === value && <Check size={13} className="text-lumina shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
