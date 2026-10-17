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
  /** Height class for the slider, e.g. "h-48". Defaults to "h-44". */
  heightClass?: string;
  /** Auto-play interval in ms. Set to 0 to disable. Defaults to 3500. */
  autoPlayMs?: number;
}

/**
 * Professional image gallery slider for hotel cards.
 * - Smooth momentum swipe via embla-carousel
 * - Auto-plays through images with a pause-on-hover
 * - Dot indicators with active highlight
 * - Main photo fills the frame; sub-images slide in from the side
 * - Gradient overlay keeps the dot nav readable
 */
export function HotelImageSlider({
  images,
  shortName,
  alt = "Hotel photo",
  heightClass = "h-44",
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

  // Auto-play
  useEffect(() => {
    if (!emblaApi || autoPlayMs <= 0 || images.length <= 1) return;

    const start = () => {
      timerRef.current = setInterval(() => {
        emblaApi.scrollNext();
      }, autoPlayMs);
    };
    const stop = () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };

    if (!isHovered) start();
    else stop();

    return stop;
  }, [emblaApi, autoPlayMs, images.length, isHovered]);

  // No images — render a branded gradient placeholder
  if (!images.length) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center bg-gradient-to-br from-primary-soft via-accent-soft to-primary-soft",
          heightClass,
        )}
      >
        <span className="text-2xl font-black tracking-tight text-primary/70">
          {shortName ?? "Hotel"}
        </span>
      </div>
    );
  }

  // Single image — skip carousel overhead
  if (images.length === 1) {
    return (
      <div className={cn("relative w-full overflow-hidden", heightClass)}>
        <img
          src={images[0]}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden", heightClass)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={() => setIsHovered(false)}
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="h-full overflow-hidden">
        <div className="flex h-full">
          {images.map((src, i) => (
            <div
              key={i}
              className="relative h-full min-w-0 shrink-0 grow-0 basis-full"
            >
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                className="h-full w-full object-cover transition-transform duration-700"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom gradient + dot indicators */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

      <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => emblaApi?.scrollTo(i)}
            className={cn(
              "pointer-events-auto rounded-full transition-all duration-300",
              i === activeIndex
                ? "h-2 w-5 bg-white shadow"
                : "h-1.5 w-1.5 bg-white/55 hover:bg-white/80",
            )}
          />
        ))}
      </div>

      {/* Image count badge — top right */}
      <div className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
        {activeIndex + 1}/{images.length}
      </div>
    </div>
  );
}
