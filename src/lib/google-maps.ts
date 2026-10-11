import { useEffect, useState } from "react";

declare global {
  interface Window {
    google: any;
    __googleMapsLoaded?: boolean;
    __googleMapsLoading?: Promise<void>;
    __googleMapsAuthFailed?: boolean;
    __initGoogleMap?: () => void;
    gm_authFailure?: () => void;
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

// Global authentication failure hook called by Google Maps JS on App Check or key rejection
if (typeof window !== "undefined") {
  window.gm_authFailure = () => {
    console.warn(
      "[Google Maps] Authentication failed (e.g. Firebase App Check enforcement on Google Cloud or API key restriction). Automatically activating fallback map.",
    );
    window.__googleMapsAuthFailed = true;
    window.dispatchEvent(new CustomEvent("google-maps-auth-failure"));
  };
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__googleMapsAuthFailed) {
    return Promise.reject(new Error("Google Maps authentication failed (App Check / key restriction)."));
  }
  if (window.__googleMapsLoaded && window.google?.maps) return Promise.resolve();
  if (window.__googleMapsLoading) return window.__googleMapsLoading;

  const key = GOOGLE_MAPS_KEY;
  if (!key) {
    return Promise.reject(new Error("Google Maps API key is not configured."));
  }

  window.__googleMapsLoading = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) {
      window.__googleMapsLoaded = true;
      resolve();
      return;
    }

    window.__initGoogleMap = () => {
      if (window.__googleMapsAuthFailed) {
        reject(new Error("Google Maps authentication failed."));
        return;
      }
      window.__googleMapsLoaded = true;
      resolve();
    };

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: "__initGoogleMap",
      libraries: "marker,places,geometry",
      v: "weekly",
    });

    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      window.__googleMapsLoading = undefined;
      reject(new Error("Failed to load Google Maps script."));
    };
    document.head.appendChild(script);
  });

  return window.__googleMapsLoading;
}

export function useGoogleMaps() {
  const [ready, setReady] = useState(() => Boolean(typeof window !== "undefined" && window.__googleMapsLoaded && !window.__googleMapsAuthFailed));
  const [authFailed, setAuthFailed] = useState(() => Boolean(typeof window !== "undefined" && window.__googleMapsAuthFailed));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const handleAuthFailure = () => {
      if (mounted) {
        setAuthFailed(true);
        setReady(false);
        setError("Google Maps authentication failed (App Check restriction active on Google Cloud).");
      }
    };

    window.addEventListener("google-maps-auth-failure", handleAuthFailure);

    loadGoogleMaps()
      .then(() => {
        if (mounted && !window.__googleMapsAuthFailed) {
          setReady(true);
        }
      })
      .catch((e: Error) => {
        if (mounted) {
          setError(e.message);
          setReady(false);
        }
      });

    return () => {
      mounted = false;
      window.removeEventListener("google-maps-auth-failure", handleAuthFailure);
    };
  }, []);

  return { ready: ready && !authFailed, authFailed, error, apiKey: GOOGLE_MAPS_KEY };
}
