import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, CreditCard, Check, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { PLANS, createStripeCheckout, createStarsInvoice } from '../lib/payments';
import { cn } from '../lib/utils';

interface PaymentModalProps {
  listingId: string;
  userId: string;
  onClose: () => void;
  onSuccess: (planId: string) => void;
}

export default function PaymentModal({ listingId, userId, onClose, onSuccess }: PaymentModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>('basic');
  const [currency, setCurrency] = useState<'EUR' | 'RON'>('EUR');
  const [loading, setLoading] = useState<'stripe' | 'stars' | null>(null);

  const plan = PLANS.find((p) => p.id === selectedPlanId)!;

  const handleFree = () => {
    onSuccess('free');
    onClose();
  };

  const handleStripe = async () => {
    if (plan.id === 'free') { handleFree(); return; }
    setLoading('stripe');
    try {
      const appUrl = window.location.origin + window.location.pathname;
      const result = await createStripeCheckout(
        listingId,
        userId,
        plan.id,
        currency,
        `${appUrl}?payment_success=1`,
        `${appUrl}?payment_cancel=1`,
      );
      if (!result?.url) throw new Error('no url');

      if (window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(result.url);
      } else {
        window.open(result.url, '_blank');
      }
      toast.success('Переходьте до оплати Stripe. Поверніться після оплати.');
      onClose();
    } catch {
      toast.error('Помилка Stripe. Спробуйте пізніше.');
    } finally {
      setLoading(null);
    }
  };

  const handleStars = async () => {
    if (plan.id === 'free') { handleFree(); return; }

    if (!window.Telegram?.WebApp?.openInvoice) {
      toast.error('Telegram Stars доступні лише всередині Telegram');
      return;
    }
    setLoading('stars');
    try {
      const result = await createStarsInvoice(listingId, userId, plan.id);
      if (!result?.invoice_link) throw new Error('no link');

      window.Telegram.WebApp.openInvoice(result.invoice_link, (status: string) => {
        setLoading(null);
        if (status === 'paid') {
          toast.success('Оплата Stars успішна!');
          onSuccess(plan.id);
          onClose();
        } else if (status === 'cancelled') {
          toast('Оплату скасовано');
        } else {
          toast.error('Помилка оплати Stars');
        }
      });
    } catch {
      toast.error('Помилка Stars. Спробуйте пізніше.');
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full bg-[#0D0F1A] border-t border-lumina/20 rounded-t-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          {/* Handle */}
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-1" />

          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-bold text-white">Оберіть план</h3>
            <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <X size={14} className="text-white/60" />
            </button>
          </div>

          {/* Plans */}
          <div className="space-y-2">
            {PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPlanId(p.id)}
                className={cn(
                  'w-full text-left p-4 rounded-2xl border transition-all',
                  selectedPlanId === p.id
                    ? 'border-lumina bg-lumina/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{p.label}</span>
                      {p.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-lumina/20 text-lumina font-semibold">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-0.5">{p.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {p.price_eur === 0 ? (
                      <span className="text-emerald-400 font-bold text-sm">FREE</span>
                    ) : (
                      <span className="text-lumina font-bold text-sm">
                        {currency === 'EUR' ? `${p.price_eur} €` : `${p.price_ron} RON`}
                      </span>
                    )}
                    {p.stars > 0 && (
                      <div className="text-[10px] text-yellow-400 mt-0.5">{p.stars} ⭐</div>
                    )}
                  </div>
                </div>

                {selectedPlanId === p.id && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-1 overflow-hidden"
                  >
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-white/65">
                        <Check size={11} className="text-lumina shrink-0" />
                        {f}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </button>
            ))}
          </div>

          {/* Currency toggle (only for paid plans) */}
          {plan.id !== 'free' && (
            <div className="flex gap-2">
              {(['EUR', 'RON'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all',
                    currency === c
                      ? 'bg-lumina text-obsidian shadow-lumina-glow'
                      : 'bg-white/10 text-white/60 hover:bg-white/15',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {plan.id === 'free' ? (
            <button
              onClick={handleFree}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
            >
              <Zap size={15} />
              Продовжити безкоштовно
            </button>
          ) : (
            <div className="space-y-2.5">
              {/* Stripe */}
              <button
                onClick={handleStripe}
                disabled={loading !== null}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
              >
                <CreditCard size={15} />
                {loading === 'stripe'
                  ? 'Завантаження...'
                  : `Оплатити ${currency === 'EUR' ? `${plan.price_eur} €` : `${plan.price_ron} RON`} — Stripe`}
              </button>

              {/* Stars */}
              <button
                onClick={handleStars}
                disabled={loading !== null}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl',
                  'bg-gradient-to-r from-yellow-500/15 to-amber-500/15',
                  'border border-yellow-500/30 hover:border-yellow-400/60',
                  'text-yellow-300 font-semibold text-sm transition-all',
                  'disabled:opacity-50',
                )}
              >
                <Star size={15} className="fill-yellow-400 text-yellow-400" />
                {loading === 'stars'
                  ? 'Відкриття...'
                  : `Оплатити ${plan.stars} ⭐ Telegram Stars`}
              </button>
            </div>
          )}

          <p className="text-center text-[11px] text-white/30 leading-relaxed pb-1">
            Платні плани — пріоритетна модерація та видимість.
            {'\n'}Безкоштовне розміщення проходить стандартну чергу.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
