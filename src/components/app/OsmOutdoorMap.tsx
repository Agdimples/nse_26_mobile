import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { VENUE_DATA, HOTELS, hotelMinRate, hotelDistanceKm, type Hotel } from "@/lib/reference";
import { formatNGN } from "@/lib/format";
import { EVENT_CONFIG } from "@/lib/event-config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Layers,
  MapPin,
  Navigation,
  Phone,
  Building2,
  Hotel as HotelIcon,
  Cross,
  Plane,
  Shield,
  Utensils,
  Maximize2,
  X,
  Compass,
} from "lucide-react";
import "leaflet/dist/leaflet.css";

type FilterCategory = "all" | "venue" | "hotels" | "hospitals" | "security" | "airport" | "food";

const CATEGORY_COLORS: Record<string, string> = {
  Venue: "#123E73",
  Hotel: "#C9A227",
  Hospital: "#16A34A",
  Security: "#DC2626",
  Airport: "#2563EB",
  Restaurant: "#EA580C",
  ATM: "#0D9488",
  Government: "#475569",
};

export function OsmOutdoorMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);

  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [locating, setLocating] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    title: string;
    category: string;
    address?: string;
    lat: number;
    lng: number;
    phone?: string;
    hotel?: Hotel;
  } | null>(null);

  // Initialize Vanilla Leaflet inside useEffect (never evaluated in SSR)
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || mapInstanceRef.current) return;

    let isCancelled = false;

    import("leaflet").then((mod) => {
      if (isCancelled || !containerRef.current) return;
      const L = mod.default || mod;

      const map = L.map(containerRef.current, {
        center: [EVENT_CONFIG.venue.latitude, EVENT_CONFIG.venue.longitude],
        zoom: 13,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      // Default Voyager tiles
      const streets = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 20,
        },
      ).addTo(map);

      tileLayerRef.current = streets;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Invalidate size on resize
      setTimeout(() => map.invalidateSize(), 250);
      window.addEventListener("resize", () => map.invalidateSize());
    });

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Sync Streets vs Satellite
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      const map = mapInstanceRef.current;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      if (mapType === "satellite") {
        tileLayerRef.current = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          {
            attribution: "Imagery &copy; Esri",
            maxZoom: 18,
          },
        ).addTo(map);
      } else {
        tileLayerRef.current = L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
            maxZoom: 20,
          },
        ).addTo(map);
      }
    });
  }, [mapType]);

  // Sync Markers when filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      const group = layerGroupRef.current;
      group.clearLayers();

      const itemsToMark: Array<{
        id: string;
        title: string;
        category: string;
        address?: string;
        lat: number;
        lng: number;
        phone?: string;
        hotel?: Hotel;
        isVenue?: boolean;
      }> = [];

      // 1. Venue
      if (activeFilter === "all" || activeFilter === "venue") {
        itemsToMark.push({
          id: "venue-icc",
          title: EVENT_CONFIG.venue.name,
          category: "Venue",
          address: EVENT_CONFIG.venue.address,
          lat: EVENT_CONFIG.venue.latitude,
          lng: EVENT_CONFIG.venue.longitude,
          phone: EVENT_CONFIG.primaryHotline,
          isVenue: true,
        });
      }

      // 2. Hotels
      if (activeFilter === "all" || activeFilter === "hotels") {
        HOTELS.forEach((h) => {
          if (h.latitude && h.longitude) {
            itemsToMark.push({
              id: `hotel-${h.id}`,
              title: h.name,
              category: "Hotel",
              address: h.location,
              lat: h.latitude,
              lng: h.longitude,
              phone: h.contactPhone,
              hotel: h,
            });
          }
        });
      }

      // 3. POIs
      VENUE_DATA.nearby.forEach((p) => {
        if (!p.latitude || !p.longitude) return;
        const catLower = p.category.toLowerCase();
        let match = false;
        if (activeFilter === "all") match = true;
        else if (activeFilter === "hospitals" && catLower.includes("hospital")) match = true;
        else if (activeFilter === "security" && catLower.includes("security")) match = true;
        else if (activeFilter === "airport" && catLower.includes("airport")) match = true;
        else if (activeFilter === "food" && (catLower.includes("restaurant") || catLower.includes("cafe"))) match = true;

        if (match) {
          itemsToMark.push({
            id: p.id,
            title: p.name,
            category: p.category,
            address: p.note,
            lat: p.latitude,
            lng: p.longitude,
            phone: p.phone,
          });
        }
      });

      itemsToMark.forEach((item) => {
        const isVenue = Boolean(item.isVenue);
        const color = CATEGORY_COLORS[item.category] ?? "#123E73";
        const size = isVenue ? 34 : 26;

        const icon = L.divIcon({
          className: "",
          html: `<span style="display:flex;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:${isVenue ? "3px" : "2.5px"} solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.4);align-items:center;justify-content:center;color:#ffffff;font-size:${size / 2}px;line-height:1;font-weight:bold;">${isVenue ? "📍" : "•"}</span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
          popupAnchor: [0, -size / 2],
        });

        const marker = L.marker([item.lat, item.lng], { icon });
        marker.on("click", () => {
          setSelectedItem(item);
          mapInstanceRef.current?.panTo([item.lat, item.lng]);
        });
        marker.addTo(group);
      });
    });
  }, [activeFilter]);

  function locateMe() {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        import("leaflet").then((mod) => {
          const L = mod.default || mod;
          const map = mapInstanceRef.current;
          const userIcon = L.divIcon({
            className: "",
            html: '<span style="display:flex;width:22px;height:22px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 6px rgba(37,99,235,0.3),0 2px 6px rgba(0,0,0,0.4)"></span>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup("<strong>You are here</strong>")
            .openPopup();
          map.setView([pos.coords.latitude, pos.coords.longitude], 15);
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-3">
      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { key: "all", label: "All Pins", icon: MapPin },
          { key: "venue", label: "Venue (ICC)", icon: Building2 },
          { key: "hotels", label: `Hotels (${HOTELS.length})`, icon: HotelIcon },
          { key: "hospitals", label: "Medical", icon: Cross },
          { key: "security", label: "Security", icon: Shield },
          { key: "airport", label: "Airport", icon: Plane },
          { key: "food", label: "Dining", icon: Utensils },
        ].map((f) => {
          const Icon = f.icon;
          const active = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key as FilterCategory)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground border border-border hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* Map Card */}
      <Card className="relative overflow-hidden border-0 shadow-elevated">
        <div ref={containerRef} className="h-[430px] w-full bg-muted/30" />

        {/* Map Floating Controls */}
        <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1.5">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setMapType((t) => (t === "streets" ? "satellite" : "streets"))}
            className="h-8 px-2.5 text-xs font-semibold shadow-md bg-white/95 text-foreground backdrop-blur"
          >
            <Layers className="h-3.5 w-3.5 mr-1 text-primary" />
            <span>{mapType === "streets" ? "Satellite" : "Streets"}</span>
          </Button>

          <Button
            size="icon"
            variant="secondary"
            onClick={locateMe}
            className="h-8 w-8 shadow-md bg-white/95 text-foreground backdrop-blur"
            title="My GPS Location"
          >
            <Navigation className={`h-4 w-4 ${locating ? "animate-spin text-primary" : "text-foreground"}`} />
          </Button>
        </div>

        {/* Live Vector / Satellite Badge */}
        <div className="absolute left-3 top-3 z-[500] pointer-events-none">
          <Badge className="bg-primary/95 text-white backdrop-blur shadow-sm text-[11px] gap-1">
            <Compass className="h-3 w-3" />
            Interactive Maiduguri Map
          </Badge>
        </div>
      </Card>

      {/* Selected Item Detail Card */}
      {selectedItem ? (
        <Card className="border-0 p-4 shadow-elevated bg-surface animate-in fade-in-50 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] uppercase font-bold">
                  {selectedItem.category}
                </Badge>
                {selectedItem.hotel && (
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {selectedItem.hotel.qualityTier}
                  </Badge>
                )}
              </div>
              <h3 className="mt-1 text-base font-bold text-foreground">{selectedItem.title}</h3>
              {selectedItem.address && (
                <p className="text-xs text-muted-foreground mt-0.5">{selectedItem.address}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground"
              onClick={() => setSelectedItem(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {selectedItem.hotel && hotelMinRate(selectedItem.hotel) && (
              <span className="font-semibold text-primary">
                From {formatNGN(hotelMinRate(selectedItem.hotel)!)}/night
              </span>
            )}
            {selectedItem.hotel && hotelDistanceKm(selectedItem.hotel) && (
              <span>· {hotelDistanceKm(selectedItem.hotel)} to ICC</span>
            )}
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <Link
              to="/directions"
              search={{
                lat: selectedItem.lat,
                lng: selectedItem.lng,
                name: selectedItem.title,
              }}
              className="flex-1"
            >
              <Button size="sm" className="w-full gap-1.5 font-semibold">
                <Navigation className="h-3.5 w-3.5" />
                Live Directions
              </Button>
            </Link>

            {selectedItem.phone && (
              <a href={`tel:${selectedItem.phone.replace(/\s+/g, "")}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Call
                </Button>
              </a>
            )}

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedItem.lat},${selectedItem.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" title="Open in Google Maps">
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </a>
          </div>
        </Card>
      ) : (
        <p className="text-xs text-muted-foreground text-center pt-1">
          Tap any pin to view details, phone contacts, and launch live directions.
        </p>
      )}
    </div>
  );
}

export default OsmOutdoorMap;
