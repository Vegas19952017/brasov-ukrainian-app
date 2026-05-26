import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  icon: LucideIcon;
  message: string;
  className?: string;
}

export default function EmptyState({ icon: Icon, message, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-8', className)}>
      <div className="ui-icon-box ui-icon-box--lg">
        <Icon size={28} className="text-royal-light" />
      </div>
      <p className="text-sm text-white/45 text-center max-w-[240px]">{message}</p>
    </div>
  );
}
