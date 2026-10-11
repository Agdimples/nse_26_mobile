import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface LeafletDirectionsMapProps {
  dest: { lat: number; lng: number; name: string };
  origin?: { lat: number; lng: number; label: string };
}

export default function LeafletDirectionsMap({ dest, origin }: LeafletDirectionsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isCancelled = false;

    import("leaflet").then((mod) => {
      if (isCancelled || !containerRef.current) return;
      const L = mod.default || mod;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, {
        center: [dest.lat, dest.lng],
        zoom: 13,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      mapRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
          maxZoom: 20,
        },
      ).addTo(map);

      // Destination Pin
      const destIcon = L.divIcon({
        className: "",
        html: '<span style="display:flex;width:32px;height:32px;border-radius:9999px;background:#C9A227;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,0.4);align-items:center;justify-content:center;color:#fff;font-size:16px;line-height:1;font-weight:bold;">📍</span>',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([dest.lat, dest.lng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>${dest.name}</strong>`);

      // Origin Pin & Polyline
      if (origin) {
        const originIcon = L.divIcon({
          className: "",
          html: '<span style="display:flex;width:24px;height:24px;border-radius:9999px;background:#123E73;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);align-items:center;justify-content:center;color:#fff;font-size:12px;line-height:1;">•</span>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([origin.lat, origin.lng], { icon: originIcon })
          .addTo(map)
          .bindPopup(`<strong>${origin.label}</strong>`);

        L.polyline(
          [
            [origin.lat, origin.lng],
            [dest.lat, dest.lng],
          ],
          {
            color: "#123E73",
            weight: 4,
            dashArray: "6, 8",
          },
        ).addTo(map);

        const bounds = L.latLngBounds([
          [origin.lat, origin.lng],
          [dest.lat, dest.lng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }

      setTimeout(() => map.invalidateSize(), 200);
    });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [dest.lat, dest.lng, origin?.lat, origin?.lng]);

  return <div ref={containerRef} className="aspect-[4/3] w-full bg-muted/20" />;
}
