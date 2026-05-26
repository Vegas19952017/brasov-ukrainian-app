import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ImagePlus, X, Send, MapPin, Languages, Map, HelpCircle, Phone, AlertCircle, Link } from 'lucide-react';
import toast from 'react-hot-toast';
import { useStore } from '../store';
import { getLocalizedName, cn } from '../lib/utils';
import { geocodeAddress } from '../lib/geocode';
import { uploadFile } from '../lib/upload';

const DISTRICTS = [
  'Astra', 'Bartolomeu', 'Blumăna', 'Brașovechi', 'Centrul Civic', 'Centrul Istoric',
  'Craiter', 'Dârste', 'Florilor', 'Gării', 'Griviței', 'Noua', 'Poiana Brașov',
  'Răcădău', 'Scriitorilor', 'Stupini', 'Șchei', 'Timiș-Triaj', 'Tractorul', 'Out of Town / Delivery'
];

const LANGUAGES: ('RU' | 'RO' | 'EN' | 'UA')[] = ['RU', 'UA', 'RO', 'EN'];

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { categories, listings, profile, updateListing } = useStore();
  const listing = listings.find((l) => l.id === id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState<'RON' | 'EUR' | 'UAH'>('RON');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [addressText, setAddressText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // MVP specialist fields
  const [selectedLanguages, setSelectedLanguages] = useState<('RU' | 'RO' | 'EN' | 'UA')[]>(['RU']);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [servicesInput, setServicesInput] = useState('');
  const [phone, setPhone] = useState('');
  // NEW: portfolio/social links (from TZ §7)
  const [portfolioLinks, setPortfolioLinks] = useState('');

  useEffect(() => {
    if (!listing) return;
    setTitle(listing.title);
    setDescription(listing.description);
    setCategoryId(listing.category_id);
    setPrice(listing.price?.toString() ?? '');
    setCurrency(listing.currency ?? 'RON');
    setTelegramUsername(listing.telegram_username);
    setAddressText(listing.address_text ?? '');
    setPhotos([...listing.photos]);
    setDepartureDate(listing.departure_date ?? '');
    setDepartureTime(listing.departure_time ?? '');
    setOrigin(listing.origin ?? '');
    setDestination(listing.destination ?? '');
    setSelectedLanguages(listing.languages || ['RU']);
    setSelectedDistricts(listing.districts || []);
    setServicesInput((listing.services || []).join(', '));
    setPhone(listing.phone || '');
  }, [listing]);

  if (!listing || !profile || listing.user_id !== profile.id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white/40 text-sm">{t('common.error')}</p>
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const isCarpooling = selectedCategory?.slug === 'transport';

  const addPhotoUrl = () => {
    if (photoUrl.trim() && photos.length < 5) {
      setPhotos([...photos, photoUrl.trim()]);
      setPhotoUrl('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || photos.length >= 5) return;
    try {
      const url = await uploadFile(file, 'listings');
      setPhotos([...photos, url]);
    } catch {
      toast.error(t('common.error'));
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
    setSubmitting(true);

    let latitude = listing.latitude;
    let longitude = listing.longitude;
    let address = addressText || null;

    if (addressText.trim() && addressText !== listing.address_text) {
      const geo = await geocodeAddress(addressText);
      if (geo) {
        latitude = geo.latitude;
        longitude = geo.longitude;
        address = geo.displayName;
      }
    }

    // Build services list, optionally appending portfolio links as a tagged entry
    const servicesList = servicesInput.split(',').map((s) => s.trim()).filter(Boolean);

    updateListing(listing.id, {
      title,
      description,
      category_id: categoryId,
      price: price ? Number(price) : null,
      currency: price ? currency : null,
      photos,
      telegram_username: telegramUsername.replace('@', ''),
      address_text: address,
      latitude,
      longitude,
      departure_date: isCarpooling && departureDate ? departureDate : null,
      departure_time: isCarpooling && departureTime ? departureTime : null,
      origin: isCarpooling && origin ? origin : null,
      destination: isCarpooling && destination ? destination : null,
      // Re-submit for moderation; clear previous rejection reason
      status: 'pending',
      rejection_reason: null,
      // MVP fields
      languages: selectedLanguages,
      districts: selectedDistricts,
      services: servicesList,
      phone: phone.trim() || null,
    });

    setSubmitting(false);
    toast.success(t('add_listing.success'));
    navigate('/cabinet');
  };

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in pb-16">
      <h2 className="text-lg font-display font-bold text-foreground">{t('add_listing.edit_title')}</h2>

      {listing.status === 'rejected' && listing.rejection_reason && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 animate-slide-up">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-600">Причина попереднього відхилення:</p>
            <p className="text-sm text-black/70 mt-1 leading-relaxed">{listing.rejection_reason}</p>
            <p className="text-[10px] text-black/30 mt-2">Виправте зауваження і надішліть повторно на модерацію.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted font-bold uppercase tracking-wider">{t('add_listing.category_label')}</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="input-glass py-3 text-sm appearance-none"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {getLocalizedName(cat, i18n.language)}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted font-bold uppercase tracking-wider">{t('add_listing.name_label')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="input-glass py-3 text-sm"
          />
        </div>

        {/* Description with char counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted font-bold uppercase tracking-wider">{t('add_listing.description_label')}</label>
            <span className={cn(
              'text-[10px] font-semibold',
              description.length < 100 ? 'text-red-500' :
              description.length > 1000 ? 'text-[#c9a84c]' : 'text-black/30'
            )}>
              {description.length} / 1000
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            maxLength={1200}
            className="input-glass py-3 text-sm resize-none"
          />
        </div>

        {/* Price + Currency */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1.5">
            <label className="text-xs text-muted font-bold uppercase tracking-wider">{t('add_listing.price_label')}</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input-glass py-3 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted font-bold uppercase tracking-wider">{t('add_listing.currency_label')}</label>
            <div className="flex flex-col gap-1">
              {(['RON', 'EUR', 'UAH'] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => setCurrency(cur)}
                  className={cn('ui-chip py-2 text-center', currency === cur && 'ui-chip--active')}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Extended Specialist Fields */}
        {!isCarpooling && (
          <div className="space-y-4 pt-3 border-t border-black/7">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Map size={14} />
              Дані спеціаліста
            </h3>

            {/* Languages */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                <Languages size={12} />
                Розмовні мови
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className={cn(
                      'ui-chip py-2 flex-1 text-center',
                      selectedLanguages.includes(lang) && 'ui-chip--active'
                    )}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                <HelpCircle size={12} />
                Послуги (через кому)
              </label>
              <input
                type="text"
                value={servicesInput}
                onChange={(e) => setServicesInput(e.target.value)}
                placeholder="напр.: Стрижка, Фарбування"
                className="input-glass py-3 text-sm"
                autoComplete="off"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                <Phone size={12} />
                Телефон (необов'язково)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+40 7xx xxx xxx"
                className="input-glass py-3 text-sm"
                autoComplete="tel"
              />
            </div>

            {/* Portfolio / social links */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider flex items-center gap-1">
                <Link size={12} />
                Соцмережі / Портфоліо (необов'язково)
              </label>
              <textarea
                value={portfolioLinks}
                onChange={(e) => setPortfolioLinks(e.target.value)}
                placeholder={"Instagram: https://instagram.com/...\nPortfolio: https://..."}
                rows={2}
                className="input-glass py-2 text-xs resize-none"
              />
              <p className="text-[10px] text-black/25">Видно тільки модератору при перевірці.</p>
            </div>

            {/* Districts */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted font-bold uppercase tracking-wider block">Райони роботи (Брашов)</label>
              <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-2 bg-black/3 rounded-xl border border-black/7">
                {DISTRICTS.map((dist) => (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => handleDistrictToggle(dist)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all duration-200',
                      selectedDistricts.includes(dist)
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black/50 border-black/10 hover:bg-black/5 hover:text-black'
                    )}
                  >
                    {dist === 'Out of Town / Delivery' ? 'Виїзд по місту' : dist}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Photos */}
        <div className="space-y-2">
          <label className="text-xs text-muted font-bold uppercase tracking-wider">{t('add_listing.photos_label')}</label>
          {photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((url, i) => (
                <div key={i} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-black/10">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                  >
                    <X size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length < 5 && (
            <div className="flex gap-2 flex-wrap">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="text-xs text-muted" />
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://…"
                className="input-glass py-2 text-xs flex-1 min-w-[120px]"
              />
              <button type="button" onClick={addPhotoUrl} className="px-3 py-2 rounded-xl bg-black/6 text-black/60 border border-black/10 hover:bg-black/10">
                <ImagePlus size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Telegram */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted font-bold uppercase tracking-wider">{t('add_listing.telegram_label')}</label>
          <input
            type="text"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            required
            className="input-glass py-3 text-sm"
          />
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <label className="text-xs text-muted font-bold uppercase tracking-wider flex items-center gap-1.5">
            <MapPin size={12} />
            {t('add_listing.address_label')}
          </label>
          <input
            type="text"
            value={addressText}
            onChange={(e) => setAddressText(e.target.value)}
            className="input-glass py-3 text-sm"
          />
        </div>

        {/* Carpooling fields */}
        {isCarpooling && (
          <div className="glass-panel p-4 grid grid-cols-2 gap-2">
            <input type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} className="input-glass py-2 text-xs" />
            <input type="time" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} className="input-glass py-2 text-xs" />
            <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder={t('carpooling.origin_placeholder')} className="input-glass py-2 text-xs" />
            <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={t('carpooling.destination_placeholder')} className="input-glass py-2 text-xs" />
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 font-bold"
        >
          <Send size={16} />
          {submitting ? t('add_listing.submitting') : t('common.save')}
        </button>
      </form>
    </div>
  );
}
