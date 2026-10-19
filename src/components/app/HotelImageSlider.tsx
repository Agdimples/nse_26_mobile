import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
}

/**
 * Professional image gallery slider for hotel cards.
 * - Responsive: aspect-ratio on mobile, capped height on desktop
 * - Smooth swipe / drag via embla-carousel
 * - Manual left / right arrow navigation (no auto-play)
 * - Pill-shaped dot nav with active stretch indicator
 * - Gradient overlay keeps the controls readable on any image
 * - N/total count badge in the top-right corner
 * - Arrows fade in on hover (desktop) and are always visible on touch devices
 */
export function HotelImageSlider({
  images,
  shortName,
  alt = "Hotel photo",
  className,
}: HotelImageSliderProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false });
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect(); // sync initial state
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      emblaApi?.scrollPrev();
    },
    [emblaApi],
  );

  const scrollNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      emblaApi?.scrollNext();
    },
    [emblaApi],
  );

  const rootCls = cn(
    "relative w-full overflow-hidden group",
    "aspect-[16/9] sm:aspect-auto sm:h-56 md:h-64 lg:h-72",
    className,
  );

  // ── No images — branded gradient placeholder ──────────────────────────
  if (!images.length) {
    return (
      <div
        className={cn(
          rootCls,
          "flex items-center justify-center bg-gradient-to-br from-primary-soft via-accent-soft to-primary-soft",
        )}
      >
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
    <div className={rootCls}>
      {/* Embla viewport */}
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

      {/* Left gradient scrim (behind prev arrow) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Right gradient scrim (behind next arrow) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      {/* Bottom gradient scrim */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />

      {/* ← Prev arrow */}
      <button
        aria-label="Previous photo"
        onClick={scrollPrev}
        className={cn(
          // Always visible on touch screens; fade in on desktop hover
          "absolute left-2.5 top-1/2 -translate-y-1/2 z-10",
          "flex h-8 w-8 items-center justify-center rounded-full",
          "bg-black/40 backdrop-blur-sm text-white shadow-lg",
          "border border-white/20",
          "transition-all duration-200",
          // on desktop: hidden until group-hover
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          "hover:bg-black/65 hover:scale-110 active:scale-95",
          !canScrollPrev && "cursor-default opacity-30 sm:opacity-0",
        )}
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
      </button>

      {/* → Next arrow */}
      <button
        aria-label="Next photo"
        onClick={scrollNext}
        className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 z-10",
          "flex h-8 w-8 items-center justify-center rounded-full",
          "bg-black/40 backdrop-blur-sm text-white shadow-lg",
          "border border-white/20",
          "transition-all duration-200",
          "opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          "hover:bg-black/65 hover:scale-110 active:scale-95",
          !canScrollNext && "cursor-default opacity-30 sm:opacity-0",
        )}
      >
        <ChevronRight className="h-4 w-4 stroke-[2.5]" />
      </button>

      {/* Dot indicators */}
      <div className="absolute inset-x-0 bottom-2.5 flex items-center justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              emblaApi?.scrollTo(i);
            }}
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
