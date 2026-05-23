import { useState, useEffect } from 'react';
import {
  MapPin, Smartphone, Clock, Globe, Wifi, Loader2,
  Monitor, AlertCircle, ExternalLink, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeoData {
  latitude:     number;
  longitude:    number;
  city:         string;
  region:       string;
  country_name: string;
  country_code: string;
  timezone:     string;
  org:          string;
  postal:       string;
}

interface Props {
  ip:        string | null;
  deviceId:  string | null;
  country:   string | null;
}

function useLocalTime(timezone: string | null) {
  const [time, setTime] = useState('');
  useEffect(() => {
    if (!timezone) return;
    const fmt = () =>
      new Intl.DateTimeFormat('uz-UZ', {
        timeZone: timezone,
        hour:     '2-digit',
        minute:   '2-digit',
        second:   '2-digit',
        hour12:   false,
      }).format(new Date());
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, [timezone]);
  return time;
}

export function UserLocationTab({ ip, deviceId, country }: Props) {
  const [geo,     setGeo]     = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [mapMode, setMapMode] = useState<'hybrid' | 'street'>('hybrid');

  const localTime = useLocalTime(geo?.timezone ?? null);

  const loadGeo = async () => {
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168')) {
      setError('Mahalliy IP — geolokatsiya mavjud emas');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // main.ts orqali so'rov (CSP cheklovisiz)
      const data = await window.electronAPI?.getGeo?.(ip);
      if (!data) throw new Error('Geolokatsiya ma\'lumoti olinmadi');
      setGeo(data);
    } catch (e: any) {
      setError(e.message ?? 'Xato yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGeo(); }, [ip]);

  // Katta xarita oynasini ochish
  const openMapWindow = async () => {
    if (!geo) return;
    await window.electronAPI?.openMap?.(
      geo.latitude,
      geo.longitude,
      `${geo.city}, ${geo.country_name}`,
      ip ?? '',
      geo.city,
      geo.country_name,
      geo.org ?? '',
      geo.timezone ?? '',
    );
  };

  // Inline mini xarita URL (iframe)
  const miniMapUrl = geo
    ? mapMode === 'hybrid'
      ? `https://maps.google.com/maps?q=${geo.latitude},${geo.longitude}&z=13&output=embed`
      : `https://www.openstreetmap.org/export/embed.html?bbox=${geo.longitude - 0.05},${geo.latitude - 0.05},${geo.longitude + 0.05},${geo.latitude + 0.05}&layer=mapnik&marker=${geo.latitude},${geo.longitude}`
    : null;

  return (
    <div className="space-y-4 p-1">
      {/* IP + Mamlakat */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard icon={<Wifi className="h-4 w-4" />}  label="IP Manzil" value={ip ?? '—'} mono />
        <InfoCard icon={<Globe className="h-4 w-4" />} label="Davlat"
          value={geo ? `${geo.country_name}` : country ?? '—'} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-gold-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Geolokatsiya aniqlanmoqda...</span>
        </div>
      )}

      {/* Xato */}
      {error && !loading && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={loadGeo}
            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium bg-amber-500/15 hover:bg-amber-500/25">
            <RefreshCw className="h-3 w-3" /> Qayta
          </button>
        </div>
      )}

      {/* Geo ma'lumotlar */}
      {geo && !loading && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <InfoCard icon={<MapPin className="h-4 w-4" />}
              label="Shahar / Viloyat"
              value={[geo.city, geo.region].filter(Boolean).join(', ') || '—'} />
            <InfoCard icon={<Clock className="h-4 w-4" />}
              label={`Mahalliy vaqt (${geo.timezone})`}
              value={localTime} mono highlight />
            <InfoCard icon={<Globe className="h-4 w-4" />}
              label="Internet provayder"
              value={geo.org || '—'} />
            <InfoCard icon={<MapPin className="h-4 w-4" />}
              label="Koordinatalar"
              value={`${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`} mono />
          </div>

          {/* Mini xarita + boshqaruv */}
          <div className="overflow-hidden rounded-xl border border-gold-900/30">
            <div className="flex items-center justify-between border-b border-gold-900/30 bg-midnight-950/60 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gold-200">
                <MapPin className="h-3.5 w-3.5 text-admin-300" />
                {geo.city}, {geo.country_name}
              </span>
              <div className="flex items-center gap-1">
                {(['hybrid', 'street'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setMapMode(m)}
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                      mapMode === m
                        ? 'bg-admin-500/20 text-admin-300'
                        : 'text-gold-700 hover:text-gold-300',
                    )}>
                    {m === 'hybrid' ? 'Google' : 'OpenStreet'}
                  </button>
                ))}
                {/* Katta xarita tugmasi */}
                <button type="button" onClick={openMapWindow}
                  className="ml-1 flex items-center gap-1 rounded bg-admin-500/15 px-2 py-0.5 text-[10px] font-semibold text-admin-300 hover:bg-admin-500/25 transition-colors">
                  <ExternalLink className="h-3 w-3" />
                  Katta xarita
                </button>
              </div>
            </div>
            <iframe
              key={miniMapUrl}
              src={miniMapUrl ?? ''}
              title="User Location"
              className="h-64 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </>
      )}

      {/* Qurilma ma'lumotlari */}
      <div className="rounded-xl border border-gold-900/30 bg-midnight-900/40 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-700">
          <Smartphone className="h-3.5 w-3.5 text-admin-300" />
          Qurilma ma'lumotlari
        </h4>
        {deviceId ? (
          <div className="space-y-2">
            <div className="flex items-start gap-3 rounded-lg bg-midnight-800/40 px-3 py-2">
              <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gold-700">Qurilma ID</div>
                <div className="mt-0.5 break-all font-mono text-xs text-gold-100">{deviceId}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-sm text-gold-700">Qurilma ma'lumoti yo'q</div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, mono, highlight }: {
  icon: React.ReactNode; label: string; value: string;
  mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gold-900/30 bg-midnight-800/40 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold-700">
        <span className="text-gold-500/70">{icon}</span>
        {label}
      </div>
      <div className={cn(
        'text-sm font-medium',
        mono      ? 'font-mono'        : '',
        highlight ? 'text-emerald-300' : 'text-gold-100',
      )}>
        {value}
      </div>
    </div>
  );
}
