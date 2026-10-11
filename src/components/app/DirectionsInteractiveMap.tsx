import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Maximize2 } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface DirectionsInteractiveMapProps {
  dest: { lat: number; lng: number; name: string };
  origin?: { lat: number; lng: number; label: string };
  encodedPolyline?: string;
}

// Decode Google encoded polyline to [[lat, lng], ...]
function decodePolyline(encoded: string): Array<[number, number]> {
  if (!encoded) return [];
  const points: Array<[number, number]> = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

export function DirectionsInteractiveMap({
  dest,
  origin,
  encodedPolyline,
}: DirectionsInteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerGroupRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const [mapType, setMapType] = useState<"streets" | "satellite">("streets");

  // Initialize Leaflet Map
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
        zoom: 14,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      mapRef.current = map;

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

      setTimeout(() => map.invalidateSize(), 250);
      const handleResize = () => map.invalidateSize();
      window.addEventListener("resize", handleResize);
    });

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync Streets vs Satellite Tiles
  useEffect(() => {
    if (!mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      const map = mapRef.current;
      if (!map) return;

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

  // Sync Markers & Route Polyline
  useEffect(() => {
    if (!mapRef.current || !layerGroupRef.current) return;

    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      const map = mapRef.current;
      const layerGroup = layerGroupRef.current;
      if (!map || !layerGroup) return;

      layerGroup.clearLayers();

      // Destination Marker
      const destIcon = L.divIcon({
        className: "",
        html: '<div style="display:flex;width:34px;height:34px;border-radius:9999px;background:#C9A227;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(0,0,0,0.45);align-items:center;justify-content:center;color:#ffffff;font-size:16px;cursor:pointer;">📍</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
      L.marker([dest.lat, dest.lng], { icon: destIcon })
        .addTo(layerGroup)
        .bindPopup(`<strong>${dest.name}</strong>`);

      // Origin Marker
      if (origin) {
        const originIcon = L.divIcon({
          className: "",
          html: '<div style="display:flex;width:24px;height:24px;border-radius:9999px;background:#123E73;border:2.5px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.4);align-items:center;justify-content:center;color:#ffffff;font-size:11px;">•</div>',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        L.marker([origin.lat, origin.lng], { icon: originIcon })
          .addTo(layerGroup)
          .bindPopup(`<strong>${origin.label}</strong>`);
      }

      // Route Polyline
      let routePoints: Array<[number, number]> = [];
      if (encodedPolyline) {
        routePoints = decodePolyline(encodedPolyline);
      }

      if (routePoints.length > 1) {
        L.polyline(routePoints, {
          color: "#123E73",
          weight: 5,
          opacity: 0.9,
          lineJoin: "round",
        }).addTo(layerGroup);

        const bounds = L.latLngBounds(routePoints);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (origin) {
        // Direct line if polyline isn't available
        L.polyline(
          [
            [origin.lat, origin.lng],
            [dest.lat, dest.lng],
          ],
          {
            color: "#123E73",
            weight: 4,
            opacity: 0.8,
            dashArray: "6, 8",
          },
        ).addTo(layerGroup);

        const bounds = L.latLngBounds([
          [origin.lat, origin.lng],
          [dest.lat, dest.lng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        map.panTo([dest.lat, dest.lng]);
      }
    });
  }, [dest.lat, dest.lng, origin?.lat, origin?.lng, encodedPolyline]);

  function fitRoute() {
    if (!mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default || mod;
      const map = mapRef.current;
      if (!map) return;
      const points = encodedPolyline ? decodePolyline(encodedPolyline) : [];
      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
      } else if (origin) {
        const bounds = L.latLngBounds([
          [origin.lat, origin.lng],
          [dest.lat, dest.lng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else {
        map.panTo([dest.lat, dest.lng]);
      }
    });
  }

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map Controls */}
      <div className="absolute left-3 top-3 z-[400] flex flex-col gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setMapType((t) => (t === "streets" ? "satellite" : "streets"))}
          className="h-8 px-2 text-xs font-semibold shadow-md gap-1 bg-white/95 text-foreground hover:bg-white"
        >
          <Layers className="h-3.5 w-3.5 text-primary" />
          <span>{mapType === "satellite" ? "Satellite" : "Map"}</span>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={fitRoute}
          className="h-8 px-2 text-xs font-semibold shadow-md gap-1 bg-white/95 text-foreground hover:bg-white"
        >
          <Maximize2 className="h-3.5 w-3.5 text-primary" />
          <span>Fit</span>
        </Button>
      </div>
    </div>
  );
}
