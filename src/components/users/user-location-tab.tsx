import { useState, useEffect } from 'react';
import {
  MapPin, Smartphone, Clock, Globe, Wifi, Loader2,
  Monitor, AlertCircle,
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

function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  return code.toUpperCase().replace(/./g, ch =>
    String.fromCodePoint(0x1F1E6 - 65 + ch.charCodeAt(0))
  );
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
  const [mapMode, setMapMode] = useState<'satellite' | 'map'>('map');

  const localTime = useLocalTime(geo?.timezone ?? null);

  useEffect(() => {
    if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168')) {
      setError('Mahalliy IP — geolokatsiya mavjud emas');
      return;
    }
    setLoading(true);
    setError('');
    fetch(`https://ipapi.co/${ip}/json/`)
      .then(r => r.json())
      .then((d: any) => {
        if (d.error) throw new Error(d.reason ?? 'Geolokatsiya xatosi');
        setGeo(d as GeoData);
      })
      .catch((e: any) => setError(e.message ?? 'IP ma\'lumoti olinmadi'))
      .finally(() => setLoading(false));
  }, [ip]);

  const mapType = mapMode === 'satellite' ? 'k' : 'm';
  const mapUrl  = geo
    ? `https://maps.google.com/maps?q=${geo.latitude},${geo.longitude}&z=13&t=${mapType}&output=embed`
    : null;

  return (
    <div className="space-y-4 p-1">
      {/* IP + Mamlakat */}
      <div className="grid grid-cols-2 gap-3">
        <InfoCard
          icon={<Wifi className="h-4 w-4" />}
          label="IP Manzil"
          value={ip ?? "—"}
          mono
        />
        <InfoCard
          icon={<Globe className="h-4 w-4" />}
          label="Davlat"
          value={
            geo
              ? `${flagEmoji(geo.country_code)} ${geo.country_name}`
              : country
              ? country
              : "—"
          }
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-gold-700">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Geolokatsiya aniqlanmoqda...</span>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {geo && !loading && (
        <>
          {/* Geolokatsiya ma'lumotlari */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon={<MapPin className="h-4 w-4" />}
              label="Shahar / Viloyat"
              value={`${geo.city}, ${geo.region}`}
            />
            <InfoCard
              icon={<Clock className="h-4 w-4" />}
              label={`Mahalliy vaqt (${geo.timezone})`}
              value={localTime}
              mono
              highlight
            />
            <InfoCard
              icon={<Globe className="h-4 w-4" />}
              label="Internet provayder"
              value={geo.org}
            />
            <InfoCard
              icon={<MapPin className="h-4 w-4" />}
              label="Koordinatalar"
              value={`${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`}
              mono
            />
          </div>

          {/* Google Maps */}
          <div className="overflow-hidden rounded-xl border border-gold-900/30">
            <div className="flex items-center justify-between border-b border-gold-900/30 bg-midnight-950/60 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-gold-200">
                <MapPin className="h-3.5 w-3.5 text-admin-300" />
                Google Maps — {geo.city}, {geo.country_name}
              </span>
              <div className="flex gap-1">
                {(['map', 'satellite'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMapMode(m)}
                    className={cn(
                      'rounded px-2 py-0.5 text-[10px] font-medium transition-colors',
                      mapMode === m
                        ? 'bg-admin-500/20 text-admin-300'
                        : 'text-gold-700 hover:text-gold-300',
                    )}
                  >
                    {m === 'map' ? 'Xarita' : 'Satellite'}
                  </button>
                ))}
              </div>
            </div>
            <iframe
              src={mapUrl ?? ''}
              title="User Location"
              className="h-72 w-full border-0"
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
                <div className="text-[10px] uppercase tracking-wider text-gold-700">
                  Qurilma ID
                </div>
                <div className="mt-0.5 break-all font-mono text-xs text-gold-100">
                  {deviceId}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-gold-700/60">
              * Qurilma markasi/modeli foydalanuvchi ilovasidan yuborilmagan
            </p>
          </div>
        ) : (
          <div className="text-center text-sm text-gold-700">
            Qurilma ma'lumoti yo'q
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  icon, label, value, mono, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gold-900/30 bg-midnight-800/40 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gold-700">
        <span className="text-gold-500/70">{icon}</span>
        {label}
      </div>
      <div className={cn(
        'text-sm font-medium',
        mono       ? 'font-mono'                           : '',
        highlight  ? 'text-emerald-300'                    : 'text-gold-100',
      )}>
        {value}
      </div>
    </div>
  );
}
