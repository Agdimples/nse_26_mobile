import { useEffect, useState } from "react";

declare global {
  interface Window {
    google: any;
    __googleMapsLoaded?: boolean;
    __googleMapsLoading?: Promise<void>;
    __initGoogleMap?: () => void;
  }
}

export const GOOGLE_MAPS_KEY: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY) ||
  (typeof process !== "undefined" && process.env?.GOOGLE_MAPS_API_KEY) ||
  "AIzaSyD0YTPW3zHpu9fcZEvHKxNvAWRWdrNpmns";

export const DEFAULT_MAP_CENTER = {
  lat: 11.8333,
  lng: 13.15,
};

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__googleMapsLoaded && window.google?.maps) return Promise.resolve();
  if (window.__googleMapsLoading) return window.__googleMapsLoading;

  const key = GOOGLE_MAPS_KEY;
  if (!key) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  window.__googleMapsLoading = new Promise<void>((resolve, reject) => {
    // If google already exists on the window object
    if (window.google?.maps) {
      window.__googleMapsLoaded = true;
      resolve();
      return;
    }

    window.__initGoogleMap = () => {
      window.__googleMapsLoaded = true;
      resolve();
    };

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__initGoogleMap",
      libraries: "marker,places,geometry,maps3d",
      v: "weekly",
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      window.__googleMapsLoading = undefined;
      reject(new Error("Failed to load Google Maps script. Check your internet connection or API key."));
    };
    document.head.appendChild(script);
  });

  return window.__googleMapsLoading;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    loadGoogleMaps()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch((e: Error) => {
        if (mounted) setError(e.message);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { ready, error, apiKey: GOOGLE_MAPS_KEY };
}
