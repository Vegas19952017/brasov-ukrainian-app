import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X, Send, MapPin, Car, Languages, Map, HelpCircle, Phone, Link } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { getLocalizedName, cn } from '../lib/utils';
import { geocodeAddress } from '../lib/geocode';
import { uploadFile } from '../lib/upload';
import PaymentModal from '../components/PaymentModal';
import DarkSelect from '../components/ui/DarkSelect';

const DISTRICTS = [
  'Astra', 'Bartolomeu', 'Blumăna', 'Brașovechi', 'Centrul Civic', 'Centrul Istoric',
  'Craiter', 'Dârste', 'Florilor', 'Gării', 'Griviței', 'Noua', 'Poiana Brașov',
  'Răcădău', 'Scriitorilor', 'Stupini', 'Șchei', 'Timiș-Triaj', 'Tractorul', 'Out of Town / Delivery'
];

const LANGUAGES: ('RU' | 'RO' | 'EN' | 'UA')[] = ['RU', 'UA', 'RO', 'EN'];

export default function AddListingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { categories, profile, addListing } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'RON' | 'EUR' | 'UAH'>('RON');
  const [telegramUsername, setTelegramUsername] = useState(profile?.username || '');
  const [addressText, setAddressText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');

  // Extended Specialist fields
  const [selectedLanguages, setSelectedLanguages] = useState<('RU' | 'RO' | 'EN' | 'UA')[]>(['RU']);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [servicesInput, setServicesInput] = useState('');
  const [phone, setPhone] = useState('');
  // NEW (TZ §7): portfolio / social links — shown to moderator during review
  const [portfolioLinks, setPortfolioLinks] = useState('');

  // Carpooling fields
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [paymentListingId, setPaymentListingId] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isCarpooling = selectedCategory?.slug === 'transport';

  const addPhotoUrl = () => {
    if (photoUrl.trim() && photos.length < 5) {
      setPhotos([...photos, photoUrl.trim()]);
      setPhotoUrl('');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 5) return;
    try {
      const url = await uploadFile(file, 'listings');
      setPhotos([...photos, url]);
    } catch (err) {
      toast.error(
        err instanceof Error && err.message === 'FILE_TOO_LARGE'
          ? t('chat.file_too_large')
          : t('common.error')
      );
    }
    e.target.value = '';
  };

  const handleLanguageToggle = (lang: 'RU' | 'RO' | 'EN' | 'UA') => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleDistrictToggle = (dist: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(dist) ? prev.filter((d) => d !== dist) : [...prev, dist]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !categoryId || !telegramUsername || !profile) return;

    setSubmitting(true);

    let latitude: number | null = null;
    let longitude: number | null = null;
    let address = addressText || null;
    if (addressText.trim()) {
      const geo = await geocodeAddress(addressText);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
        address = geo.displayName;
      }
    }

    const newListing = {
      id: `lst-${Date.now()}`,
      user_id: profile.id,
      category_id: categoryId,
      title,
      description,
      price: price ? Number(price) : null,
      currency: price ? currency : null,
      photos,
      telegram_username: telegramUsername.replace('@', ''),
      owner_telegram_id: profile.telegram_id,
      status: 'pending' as const,
      rating_avg: 0,
      latitude,
      longitude,
      address_text: address,
      departure_date: isCarpooling && departureDate ? departureDate : null,
      departure_time: isCarpooling && departureTime ? departureTime : null,
      origin: isCarpooling && origin ? origin : null,
      destination: isCarpooling && destination ? destination : null,
      is_featured: false,

      // MVP fields
      languages: selectedLanguages,
      districts: selectedDistricts,
      services: servicesInput.split(',').map((s) => s.trim()).filter(Boolean),
      phone: phone.trim() || null,
      is_verified: false,
      promotion_level: 'free' as const,
      promotion_until: null,
      rejection_reason: null,

      created_at: new Date().toISOString(),
    };

    addListing(newListing);
    setSubmitting(false);
    setPaymentListingId(newListing.id);
  };

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in pb-16">
      <h2 className="text-lg font-display font-bold text-white">{t('add_listing.title')}</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs text-white/50 font-bold uppercase tracking-wider">{t('add_listing.category_label')}</label>
          <DarkSelect
            value={categoryId}
            onChange={setCategoryId}
            required
            placeholder={t('add_listing.select_category')}
            options={categories.map((cat) => ({
              value: cat.id,
              label: getLocalizedName(cat, i18n.language),
            }))}
          />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="text-xs text-white/50 font-bold uppercase tracking-wider">{t('add_listing.name_label')}</label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t('add_listing.name_placeholder')}
            className="input-glass py-3 text-sm"
            autoComplete="off"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="text-xs text-white/50 font-bold uppercase tracking-wider">{t('add_listing.description_label')}</label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder={t('add_listing.description_placeholder')}
            className="input-glass py-3 text-sm resize-none"
            autoComplete="off"
          />
        </div>

        {/* Price + Currency */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <label htmlFor="price" className="text-xs text-white/50 font-bold uppercase tracking-wider">{t('add_listing.price_label')}</label>
            <input
              id="price"
              name="price"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t('add_listing.price_placeholder')}
              className="input-glass py-3 text-sm"
              inputMode="decimal"
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/50 font-bold uppercase tracking-wider">{t('add_listing.currency_label')}</label>
            <div className="flex gap-1">
              {(['RON', 'EUR', 'UAH'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  className={cn('ui-chip flex-1 py-3', currency === cur && 'ui-chip--active text-amber')}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Extended Fields for Specialists (Non-Carpooling) */}
        {!isCarpooling && (
          <div className="space-y-4 pt-3 border-t border-glass-border">
            <h3 className="text-xs font-bold text-royal-light uppercase tracking-wider flex items-center gap-1.5">
              <Map size={14} />
              Дополнительные поля MVP
            </h3>

            {/* Languages */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-1">
                <Languages size={12} />
                Разговорные языки
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => {
                  const active = selectedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleLanguageToggle(lang)}
                      className={cn(
                        'ui-chip py-2 flex-1 text-center',
                        active && 'ui-chip--active text-royal-light'
                      )}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Service Tags */}
            <div className="space-y-1.5">
              <label htmlFor="services" className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-1">
                <HelpCircle size={12} />
                Предоставляемые услуги (через запятую)
              </label>
              <input
                id="services"
                type="text"
                value={servicesInput}
                onChange={(e) => setServicesInput(e.target.value)}
                placeholder="напр.: Стрижка, Окрашивание, Укладка"
                className="input-glass py-3 text-sm"
                autoComplete="off"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-1">
                <Phone size={12} />
                Контактный телефон (необязательно)
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+40 7xx xxx xxx"
                className="input-glass py-3 text-sm"
                autoComplete="tel"
              />
            </div>

            {/* NEW (TZ §7): Portfolio / social links */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-1">
                <Link size={12} />
                Соцсети / Портфолио (необязательно)
              </label>
              <textarea
                value={portfolioLinks}
                onChange={(e) => setPortfolioLinks(e.target.value)}
                placeholder="Instagram: https://instagram.com/..."
                rows={2}
                className="input-glass py-2 text-xs resize-none"
              />
              <p className="text-[10px] text-white/25">Видны только модератору при проверке.</p>
            </div>

            {/* Districts of Brasov */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-white/50 font-bold uppercase tracking-wider block">Районы работы (Брашов)</label>
              <p className="text-[10px] text-white/30">Выберите районы, где вы оказываете услуги:</p>
              <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-2 bg-obsidian-900/50 rounded-xl border border-glass-border">
                {DISTRICTS.map((dist) => {
                  const active = selectedDistricts.includes(dist);
                  return (
                    <button
                      key={dist}
                      type="button"
                      onClick={() => handleDistrictToggle(dist)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all duration-200',
                        active
                          ? 'bg-royal/20 text-royal-light border-royal/40'
                          : 'bg-obsidian-800/40 text-white/50 border-glass-border hover:bg-glass-hover hover:text-white'
                      )}
                    >
                      {dist === 'Out of Town / Delivery' ? 'Выезд по городу' : dist}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="space-y-2">
          <label className="text-xs text-white/50 font-bold uppercase tracking-wider">{t('add_listing.photos_label')}</label>

          {/* Photo previews */}
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((url, i) => (
                <div key={i} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-glass-border">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                    aria-label="Remove photo"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 5 && (
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="text-xs text-white/50"
              />
              <div className="flex gap-2">
                <input
                  id="photo-url"
                  name="photo-url"
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Или ссылка: https://…"
                  className="input-glass py-2 text-xs flex-1"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={addPhotoUrl}
                  aria-label={t('add_listing.photos_add')}
                  className="px-3 py-2 rounded-xl bg-royal/20 text-royal-light border border-royal/30 hover:bg-royal/30 transition-colors"
                >
                  <ImagePlus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Telegram username */}
        <div className="space-y-1.5">
          <label htmlFor="telegram" className="text-xs text-white/50 font-bold uppercase tracking-wider">{t('add_listing.telegram_label')}</label>
          <input
            id="telegram"
            name="telegram"
            type="text"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            required
            placeholder={t('add_listing.telegram_placeholder')}
            className="input-glass py-3 text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label htmlFor="address" className="text-xs text-white/50 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={12} />
            {t('add_listing.address_label')} (офис / адрес)
          </label>
          <input
            id="address"
            name="address"
            type="text"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            placeholder={t('add_listing.address_placeholder')}
            className="input-glass py-3 text-sm"
            autoComplete="street-address"
          />
        </div>

        {/* Carpooling fields */}
        {isCarpooling && (
          <div className="glass-panel p-4 space-y-3">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Car size={14} />
              {t('carpooling.title')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] text-white/40">{t('carpooling.date_label')}</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="input-glass py-2 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40">{t('carpooling.time_label')}</label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="input-glass py-2 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40">{t('carpooling.origin_label')}</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder={t('carpooling.origin_placeholder')}
                  className="input-glass py-2 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-white/40">{t('carpooling.destination_label')}</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={t('carpooling.destination_placeholder')}
                  className="input-glass py-2 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !title || !description || !categoryId || !telegramUsername}
          className={cn(
            'btn-primary w-full flex items-center justify-center gap-2 py-3.5 shadow-blue-glow font-bold',
            (submitting || !title || !description || !categoryId) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Send size={16} />
          <span>{submitting ? t('add_listing.submitting') : t('add_listing.submit')}</span>
        </button>
      </form>

      {paymentListingId && profile && (
        <PaymentModal
          listingId={paymentListingId}
          userId={profile.id}
          onClose={() => {
            setPaymentListingId(null);
            toast.success(t('add_listing.success'));
            navigate('/cabinet');
          }}
          onSuccess={() => {
            toast.success(t('add_listing.success'));
            navigate('/cabinet');
          }}
        />
      )}
    </div>
  );
}
