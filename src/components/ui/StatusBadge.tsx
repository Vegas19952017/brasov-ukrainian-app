import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

type Status = 'approved' | 'pending' | 'rejected';

interface Props {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  const { t } = useTranslation();

  const config = {
    approved: {
      icon: CheckCircle2,
      label: t('listing.status_approved'),
      className: 'badge-approved',
    },
    pending: {
      icon: Clock3,
      label: t('listing.status_pending'),
      className: 'badge-pending',
    },
    rejected: {
      icon: XCircle,
      label: t('listing.status_rejected'),
      className: 'badge-rejected',
    },
  }[status];

  const Icon = config.icon;

  return (
    <span className={cn(config.className, className)}>
      <Icon size={12} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
