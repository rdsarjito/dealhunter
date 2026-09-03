'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Sliders, 
  X,
  Home
} from 'lucide-react';

interface LocationMapPickerProps {
  initialLocation?: string;
  initialRadiusKm?: number;
  onChange: (location: string, radiusKm: number, lat?: number, lng?: number) => void;
}

interface AutocompleteResult {
  name: string;
  city?: string;
  state?: string;
  lat: number;
  lng: number;
  fullLabel: string;
}

// User's exact home location in Kebayoran Lama, Jakarta Selatan
const USER_EXACT_LOCATION = {
  lat: -6.2464309,
  lng: 106.7707263,
  name: 'Kebayoran Lama, Jakarta Selatan',
  address: 'Jl. Delman Asri VI No.115, Kebayoran Lama Utara',
};

export function LocationMapPicker({
  initialLocation = 'Kebayoran Lama, Jakarta Selatan',
  initialRadiusKm = 25,
  onChange,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);

  const [currentCity, setCurrentCity] = useState(
    initialLocation === 'Jakarta' ? USER_EXACT_LOCATION.name : initialLocation
  );
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: USER_EXACT_LOCATION.lat,
    lng: USER_EXACT_LOCATION.lng,
  });
  const [radiusKm, setRadiusKm] = useState(initialRadiusKm);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      
      const L = (await import('leaflet')).default;

      if (!isMounted) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Check saved location in localStorage or use exact Delman Asri coordinates
      let savedLat = USER_EXACT_LOCATION.lat;
      let savedLng = USER_EXACT_LOCATION.lng;
      let savedName = USER_EXACT_LOCATION.name;

      try {
        const saved = localStorage.getItem('dealhunter_my_location');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.lat && parsed.lng) {
            savedLat = parsed.lat;
            savedLng = parsed.lng;
            savedName = parsed.name || savedName;
          }
        }
      } catch (e) {}

      const map = L.map(mapContainerRef.current, {
        center: [savedLat, savedLng],
        zoom: 15,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // YouTube Red Pin
      const pinIcon = L.divIcon({
        className: 'youtube-map-pin',
        html: `
          <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#FF0000;color:white;border-radius:50%;box-shadow:0 3px 12px rgba(255,0,0,0.4);border:2.5px solid white;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([savedLat, savedLng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      // Semi-transparent Radius Circle
      const circle = L.circle([savedLat, savedLng], {
        radius: initialRadiusKm * 1000,
        color: '#FF0000',
        weight: 1.5,
        fillColor: '#FF0000',
        fillOpacity: 0.12,
      }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;

      setCurrentCity(savedName);
      setCoords({ lat: savedLat, lng: savedLng });
      onChange(savedName, initialRadiusKm, savedLat, savedLng);

      // Map Click: move pin
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        circle.setLatLng([lat, lng]);
        setSuggestions([]);
        await reverseGeocode(lat, lng);
      });

      // Marker Drag: move pin
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        circle.setLatLng(pos);
        setSuggestions([]);
        await reverseGeocode(pos.lat, pos.lng);
      });
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update radius circle when slider changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000);
      onChange(currentCity, radiusKm, coords.lat, coords.lng);
    }
  }, [radiusKm, currentCity, onChange]);

  // Live Autocomplete while typing
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          const items: AutocompleteResult[] = (data.features || []).map((f: any) => {
            const props = f.properties || {};
            const [lng, lat] = f.geometry?.coordinates || [0, 0];
            const name = props.name || props.street || '';
            const city = props.city || props.district || '';
            const state = props.state || '';
            const parts = [name, city, state].filter(Boolean);
            return {
              name,
              city,
              state,
              lat,
              lng,
              fullLabel: parts.join(', '),
            };
          });
          setSuggestions(items);
        }
      } catch (err) {}
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reverse geocoding to pinpoint Indonesian administrative location
  const reverseGeocode = async (lat: number, lng: number) => {
    // Check if close to user's home (within 500m)
    const distHome = Math.hypot(USER_EXACT_LOCATION.lat - lat, USER_EXACT_LOCATION.lng - lng);
    if (distHome < 0.005) {
      setCurrentCity(USER_EXACT_LOCATION.name);
      setCoords({ lat: USER_EXACT_LOCATION.lat, lng: USER_EXACT_LOCATION.lng });
      onChange(USER_EXACT_LOCATION.name, radiusKm, USER_EXACT_LOCATION.lat, USER_EXACT_LOCATION.lng);
      return;
    }

    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`
      );
      if (res.ok) {
        const data = await res.json();
        const locality = data.locality;
        const city = data.city || data.principalSubdivision;
        
        let label = '';
        if (locality && city && locality !== city) {
          label = `${locality}, ${city}`;
        } else {
          label = locality || city || 'Jakarta';
        }

        const cleanLabel = label.replace(/Kota |Kabupaten |South /gi, (match) => {
          if (match.toLowerCase().includes('south')) return 'Selatan ';
          return '';
        }).trim();

        setCurrentCity(cleanLabel);
        setCoords({ lat, lng });
        onChange(cleanLabel, radiusKm, lat, lng);

        try {
          localStorage.setItem('dealhunter_my_location', JSON.stringify({ lat, lng, name: cleanLabel }));
        } catch (e) {}

        return;
      }
    } catch (e) {}
  };

  // Move map to specific coordinate
  const moveMapTo = (lat: number, lng: number, labelName: string, zoomLevel = 16) => {
    if (!mapInstanceRef.current || !markerRef.current || !circleRef.current) return;

    mapInstanceRef.current.flyTo([lat, lng], zoomLevel, { duration: 1 });
    markerRef.current.setLatLng([lat, lng]);
    circleRef.current.setLatLng([lat, lng]);
    setCurrentCity(labelName);
    setCoords({ lat, lng });
    onChange(labelName, radiusKm, lat, lng);
    setSuggestions([]);
    setSearchQuery('');

    try {
      localStorage.setItem('dealhunter_my_location', JSON.stringify({ lat, lng, name: labelName }));
    } catch (e) {}
  };

  // Snaps 100% accurately to user's exact address (Jl. Delman Asri VI, Kebayoran Lama)
  const handleSnapToMyLocation = () => {
    moveMapTo(
      USER_EXACT_LOCATION.lat,
      USER_EXACT_LOCATION.lng,
      USER_EXACT_LOCATION.name,
      16
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Input Bar with Live Autocomplete */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari jalan, perumahan, kecamatan (misal: Delman Asri, Gandaria, Tebet)..."
              className="w-full h-9 pl-3 pr-8 rounded-xl border border-[#CCCCCC] dark:border-[#303030] bg-white dark:bg-[#121212] text-foreground text-xs focus:outline-none focus:border-[#FF0000]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                }}
                className="absolute right-2.5 top-2.5 text-[#606060] hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 100% Accurate "Lokasi Saya" Button */}
          <button
            type="button"
            onClick={handleSnapToMyLocation}
            className="h-9 px-3 rounded-xl bg-white dark:bg-[#121212] hover:bg-[#F2F2F2] dark:hover:bg-[#272727] text-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0 border border-[#CCCCCC] dark:border-[#303030] cursor-pointer"
            title="Kunci ke Lokasi Saya (Jl. Delman Asri VI, Kebayoran Lama)"
          >
            <Navigation className="h-3.5 w-3.5 text-[#FF0000]" />
            <span className="hidden sm:inline">Lokasi Saya</span>
          </button>
        </div>

        {/* Live Search Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-10 left-0 w-full sm:w-[85%] bg-card border border-[#E5E5E5] dark:border-[#303030] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#E5E5E5] dark:divide-[#303030] animate-in fade-in-50 duration-150">
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => moveMapTo(item.lat, item.lng, item.name || item.fullLabel, 16)}
                className="w-full px-3 py-2 text-left hover:bg-[#F2F2F2] dark:hover:bg-[#272727] flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <MapPin className="h-4 w-4 text-[#FF0000] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground truncate">{item.name}</div>
                  <div className="text-[10px] text-[#606060] dark:text-[#AAAAAA] truncate">{item.fullLabel}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Map Container */}
      <div className="relative w-full h-[230px] rounded-xl overflow-hidden border border-[#E5E5E5] dark:border-[#303030] bg-[#F2F2F2] dark:bg-[#272727] shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Live Location & Radius Badge */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-black/85 text-white text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-xs shadow-md">
            <MapPin className="h-3 w-3 text-[#FF0000]" />
            <span className="max-w-[220px] truncate">{currentCity}</span>
            <span className="text-neutral-300">· Radius {radiusKm} km</span>
          </div>
        </div>

        <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
          <span className="px-2 py-0.5 rounded bg-black/75 text-white text-[9px]">
            Geser pin merah atau ketik di pencarian untuk ubah titik
          </span>
        </div>
      </div>

      {/* Interactive Radius Slider */}
      <div className="p-3 rounded-xl bg-[#F2F2F2] dark:bg-[#272727] border border-[#E5E5E5] dark:border-[#303030] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-[#FF0000]" />
            <span>Jangkauan Radius Pantauan</span>
          </span>
          <span className="font-bold text-[#FF0000] text-sm tabular-price">
            {radiusKm} km
          </span>
        </div>

        <input
          type="range"
          min="5"
          max="100"
          step="5"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full h-1.5 bg-[#CCCCCC] dark:bg-[#404040] rounded-lg appearance-none cursor-pointer accent-[#FF0000]"
        />

        <div className="flex justify-between items-center text-[10px] text-[#606060] dark:text-[#AAAAAA]">
          <span>5 km (Dekat)</span>
          <span>25 km (Rekomendasi Jabodetabek)</span>
          <span>50 km</span>
          <span>100 km</span>
        </div>
      </div>
    </div>
  );
}
