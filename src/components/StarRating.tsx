import { Star } from 'lucide-react';
import { cn } from '../lib/utils';

interface Props {
  rating: number;
  size?: number;
  showValue?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRating({
  rating,
  size = 14,
  showValue = true,
  interactive = false,
  onChange,
}: Props) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={cn(
            'transition-all duration-150',
            interactive && 'cursor-pointer hover:scale-125 active:scale-95',
            !interactive && 'cursor-default'
          )}
        >
          <Star
            size={size}
            className={cn(
              star <= Math.round(rating) ? 'star-filled fill-current' : 'star-empty'
            )}
          />
        </button>
      ))}
      {showValue && rating > 0 && (
        <span className="text-[11px] text-white/50 ml-1 font-medium">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
