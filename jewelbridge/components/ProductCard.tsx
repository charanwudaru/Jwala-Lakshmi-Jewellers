'use client';
import { Eye, Bookmark, Weight, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import RequestModal from './RequestModal';
import type { ProductStatus } from '@/app/lib/api';

interface ProductCardProps {
  id: string;
  image: string;
  imageUrls?: string[] | null;
  status: ProductStatus;
  title: string;
  spec: string;
  views: string;
}

export default function ProductCard({ id, image, imageUrls, status, title, spec, views }: ProductCardProps) {
  const [saved, setSaved] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const slides = imageUrls?.length ? imageUrls : [image];
  const currentImage = slides[Math.min(slideIndex, slides.length - 1)] || image;

  const moveSlide = (direction: -1 | 1) => {
    setSlideIndex(current => (current + direction + slides.length) % slides.length);
  };

  const finishDrag = (x: number) => {
    if (dragStart === null || slides.length < 2) return;
    const distance = x - dragStart;
    if (Math.abs(distance) > 36) moveSlide(distance > 0 ? -1 : 1);
    setDragStart(null);
  };

  return (
    <>
      <div className="product-card fade-in">
        <div
          className="card-img-wrap"
          onPointerDown={event => setDragStart(event.clientX)}
          onPointerUp={event => finishDrag(event.clientX)}
          onPointerCancel={() => setDragStart(null)}
          onPointerLeave={event => finishDrag(event.clientX)}
        >
          <img src={currentImage} alt={title} />
          <div className="card-badge">
            <span className={`badge-dot ${status === 'available' ? 'green' : 'orange'}`} />
            <span className={status === 'available' ? 'badge-available' : 'badge-reserved'}>
              {status === 'available' ? 'Available' : 'Reserved'}
            </span>
          </div>
          {slides.length > 1 && (
            <>
              <button className="card-slide-btn left" aria-label="Previous image" onClick={event => { event.stopPropagation(); moveSlide(-1); }}>
                <ChevronLeft size={16} />
              </button>
              <button className="card-slide-btn right" aria-label="Next image" onClick={event => { event.stopPropagation(); moveSlide(1); }}>
                <ChevronRight size={16} />
              </button>
              <div className="card-slide-count">{slideIndex + 1}/{slides.length}</div>
              <div className="card-slide-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={index === slideIndex ? 'active' : ''}
                    aria-label={`Show image ${index + 1}`}
                    onClick={event => {
                      event.stopPropagation();
                      setSlideIndex(index);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="card-body">
          <div className="card-title">{title}</div>
          <div className="card-spec">
            <Weight size={12} />
            {spec}
          </div>
          <div className="card-footer">
            <div className="card-views">
              <Eye size={13} />
              {views}
            </div>
            <button
              className="bookmark-btn"
              onClick={() => setSaved(s => !s)}
              aria-label="Bookmark"
            >
              <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} color={saved ? '#c9a84c' : undefined} />
            </button>
          </div>
          <button
            className="request-btn"
            id={`request-${title.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={() => setRequesting(true)}
          >
            <Send size={13} />
            Request Design
          </button>
        </div>
      </div>

      {requesting && (
        <RequestModal
          productId={id}
          title={title}
          spec={spec}
          onClose={() => setRequesting(false)}
        />
      )}
    </>
  );
}
