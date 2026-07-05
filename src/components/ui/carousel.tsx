'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

type CarouselContextValue = {
  viewportRef: React.MutableRefObject<HTMLDivElement | null>
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
  selectedIndex: number
  slideCount: number
  scrollTo: (index: number) => void
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)
  if (!context) throw new Error('Carousel components must be used within <Carousel />')
  return context
}

export function Carousel({
  className,
  children,
}: React.ComponentProps<'div'>) {
  const viewportRef = React.useRef<HTMLDivElement | null>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [slideCount, setSlideCount] = React.useState(0)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

  const updateState = React.useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const slides = Array.from(viewport.children) as HTMLElement[]
    const current = viewport.scrollLeft
    const width = viewport.clientWidth || 1
    const index = Math.round(current / width)
    setSelectedIndex(Math.min(Math.max(index, 0), Math.max(slides.length - 1, 0)))
    setSlideCount(slides.length)
    setCanScrollPrev(current > 0)
    setCanScrollNext(current + width < viewport.scrollWidth - 1)
  }, [])

  React.useEffect(() => {
    updateState()
    const viewport = viewportRef.current
    if (!viewport) return
    const onScroll = () => updateState()
    const onResize = () => updateState()
    viewport.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      viewport.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [updateState])

  const scrollTo = React.useCallback((index: number) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const width = viewport.clientWidth || 1
    viewport.scrollTo({ left: index * width, behavior: 'smooth' })
  }, [])

  const scrollPrev = React.useCallback(() => {
    scrollTo(Math.max(0, selectedIndex - 1))
  }, [scrollTo, selectedIndex])

  const scrollNext = React.useCallback(() => {
    scrollTo(Math.min(slideCount - 1, selectedIndex + 1))
  }, [scrollTo, selectedIndex, slideCount])

  return (
    <CarouselContext.Provider value={{ viewportRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext, selectedIndex, slideCount, scrollTo }}>
      <div className={cn('relative', className)} role="region" aria-roledescription="carousel">
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

export function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
  const { viewportRef } = useCarousel()
  return (
      <div
      ref={viewportRef}
      className={cn('flex overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none', className)}
      {...props}
    />
  )
}

export function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('min-w-0 shrink-0 grow-0 basis-full snap-start', className)} {...props} />
}

export function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollPrev, canScrollPrev } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      className={cn('absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-lg', className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
}

export function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
  const { scrollNext, canScrollNext } = useCarousel()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={scrollNext}
      disabled={!canScrollNext}
      className={cn('absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full shadow-lg', className)}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
}

export function CarouselDots({ className }: { className?: string }) {
  const { slideCount, selectedIndex, scrollTo } = useCarousel()
  if (slideCount <= 1) return null
  return (
    <div className={cn('mt-3 flex items-center justify-center gap-2', className)}>
      {Array.from({ length: slideCount }).map((_, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Go to slide ${index + 1}`}
          onClick={() => scrollTo(index)}
          className={cn('h-2.5 w-2.5 rounded-full transition', index === selectedIndex ? 'bg-slate-900' : 'bg-slate-300 hover:bg-slate-500')}
        />
      ))}
    </div>
  )
}
