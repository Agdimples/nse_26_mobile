import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";

interface HotelImageSliderProps {
  /** Array of image URLs to display. If empty, renders the fallback. */
  images: string[];
  /** Hotel short name used in the fallback placeholder. */
  shortName?: string;
  /** Alt text for the images. */
  alt?: string;
  /**
   * Extra classes applied to the root wrapper.
   * Defaults to a 16:9 aspect ratio on mobile that grows to a fixed
   * max-height on wider screens — overridable by the caller.
   */
  className?: string;
  /** Auto-play interval in ms. Set to 0 to disable. Defaults to 3500. */
  autoPlayMs?: number;
}

/**
 * Professional image gallery slider for hotel cards.
 * - Responsive: aspect-ratio on mobile, capped height on desktop
 * - Smooth momentum swipe via embla-carousel
 * - Auto-plays through images with a pause-on-hover/touch
 * - Pill-shaped dot nav with active stretch indicator
 * - Gradient overlay keeps the dot nav readable on any image
 * - N/total count badge in the top-right corner
 */
export function HotelImageSlider({
  images,
  shortName,
  alt = "Hotel photo",
  className,
  autoPlayMs = 3500,
}: HotelImageSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  // Auto-play — pauses while the user is hovering/touching
  useEffect(() => {
    if (!emblaApi || autoPlayMs <= 0 || images.length <= 1) return;

    const start = () => {
      timerRef.current = setInterval(() => emblaApi.scrollNext(), autoPlayMs);
    };
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };

    if (!isHovered) start(); else stop();
    return stop;
  }, [emblaApi, autoPlayMs, images.length, isHovered]);

  /**
   * Root wrapper classes:
   * - `aspect-[16/9]`  → natural 16:9 on narrow mobile (fills full width)
   * - `sm:aspect-auto sm:h-56` → fixed 224 px on ≥640 px screens
   * - `md:h-64`        → a bit taller on desktop cards
   * - `lg:h-72`        → even taller on wide layouts
   * The caller can override with `className`.
   */
  const rootCls = cn(
    "relative w-full overflow-hidden",
    "aspect-[16/9] sm:aspect-auto sm:h-56 md:h-64 lg:h-72",
    className,
  );

  // ── No images — branded gradient placeholder ──────────────────────────
  if (!images.length) {
    return (
      <div className={cn(rootCls, "flex items-center justify-center bg-gradient-to-br from-primary-soft via-accent-soft to-primary-soft")}>
        <span className="text-2xl font-black tracking-tight text-primary/70">
          {shortName ?? "Hotel"}
        </span>
      </div>
    );
  }

  // ── Single image — no carousel overhead ──────────────────────────────
  if (images.length === 1) {
    return (
      <div className={rootCls}>
        <img
          src={images[0]}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover object-center"
          loading="lazy"
        />
      </div>
    );
  }

  // ── Gallery slider ────────────────────────────────────────────────────
  return (
    <div
      className={rootCls}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Embla viewport — must fill the positioned parent */}
      <div ref={emblaRef} className="absolute inset-0 overflow-hidden">
        <div className="flex h-full">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
            >
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                className="h-full w-full object-cover object-center"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient scrim */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

      {/* Dot indicators */}
      <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "rounded-full transition-all duration-300",
              i === activeIndex
                ? "h-2 w-5 bg-white shadow-sm"
                : "h-1.5 w-1.5 bg-white/55 hover:bg-white/80",
            )}
          />
        ))}
      </div>

      {/* N / total badge */}
      <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        {activeIndex + 1}/{images.length}
      </div>
    </div>
  );
}
