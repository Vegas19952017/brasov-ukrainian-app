import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List, MapPin } from 'lucide-react';
import { useStore } from '../store';
import { BRASOV_CENTER, BRASOV_ZOOM, formatPrice, cn } from '../lib/utils';

declare const L: any;

export default function MapPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { listings } = useStore();

  const geoListings = listings.filter(
    (l) => l.status === 'approved' && l.latitude !== null && l.longitude !== null
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapRef.current, {
      center: BRASOV_CENTER,
      zoom: BRASOV_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Custom marker icon
    const createIcon = (isFeatured: boolean) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${isFeatured ? 'linear-gradient(135deg, #eab308, #ca8a04)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)'};
            border: 2px solid ${isFeatured ? 'rgba(234, 179, 8, 0.6)' : 'rgba(37, 99, 235, 0.6)'};
            box-shadow: 0 4px 16px ${isFeatured ? 'rgba(234, 179, 8, 0.4)' : 'rgba(37, 99, 235, 0.4)'};
            cursor: pointer;
            transition: transform 0.2s;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -38],
      });
    };

    // Add markers
    geoListings.forEach((listing) => {
      const marker = L.marker(
        [listing.latitude, listing.longitude],
        { icon: createIcon(listing.is_featured) }
      ).addTo(map);

      const photoHtml = listing.photos.length > 0
        ? `<img src="${listing.photos[0]}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />`
        : '';

      const priceHtml = listing.price !== null
        ? `<div style="color:#c9a84c;font-weight:700;font-size:14px;margin-top:4px;">${formatPrice(listing.price, listing.currency)}</div>`
        : '';

      marker.bindPopup(`
        <div style="min-width:200px;max-width:250px;font-family:'Inter',sans-serif;">
          ${photoHtml}
          <div style="font-weight:600;font-size:14px;color:#000;line-height:1.3;">${listing.title}</div>
          <div style="font-size:11px;color:#6F6F6F;margin-top:4px;line-height:1.4;">
            ${listing.description.slice(0, 80)}…
          </div>
          ${priceHtml}
          ${listing.address_text ? `<div style="font-size:10px;color:#9ca3af;margin-top:6px;">${listing.address_text}</div>` : ''}
          <button
            onclick="window.__navigateToListing('${listing.id}')"
            style="
              margin-top:10px;
              width:100%;
              padding:8px;
              background:#000000;
              color:white;
              border:none;
              border-radius:20px;
              font-size:12px;
              font-weight:600;
              cursor:pointer;
            "
          >
            ${t('map.details')} →
          </button>
        </div>
      `, {
        maxWidth: 260,
        className: 'custom-popup',
      });
    });

    mapInstanceRef.current = map;

    // Global navigate handler for popup buttons
    (window as any).__navigateToListing = (listingId: string) => {
      navigate(`/listing/${listingId}`);
    };

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      delete (window as any).__navigateToListing;
    };
  }, [geoListings, navigate, t, i18n.language]);

  return (
    <div className="relative h-[calc(100vh-140px)]">
      {/* Map title bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center justify-between">
        <div className="glass-panel px-4 py-2.5 flex items-center gap-2">
          <MapPin size={16} className="text-black/60" />
          <span className="text-sm font-display font-bold text-foreground">{t('map.title')}</span>
          <span className="text-[10px] text-muted ml-1 font-medium">
            {geoListings.length}
          </span>
        </div>

        <button
          onClick={() => navigate('/')}
          className="glass-panel px-3 py-2.5 flex items-center gap-1.5 hover:bg-black/4 transition-colors"
        >
          <List size={14} className="text-muted" />
          <span className="text-xs text-muted font-medium">{t('map.show_list')}</span>
        </button>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full h-full map-container rounded-none"
        style={{ borderRadius: 0 }}
      />
    </div>
  );
}
