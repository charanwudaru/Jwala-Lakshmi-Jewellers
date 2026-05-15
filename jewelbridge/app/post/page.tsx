'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlignLeft, Camera, ChevronDown, Contrast, Crop, Droplets, ImagePlus, Plus, RotateCw, Sparkles, Sun, Type, X } from 'lucide-react';
import BottomNav from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { apiFetch, getToken, type Product, type User } from '@/app/lib/api';

interface Slide {
  id: string;
  file: File;
  url: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  zoom: number;
  cropX: number;
  cropY: number;
  text: string;
}

const emptySlideState = {
  brightness: 65,
  contrast: 40,
  saturation: 50,
  rotation: 0,
  zoom: 100,
  cropX: 0,
  cropY: 0,
  text: '',
};

function makeSlide(file: File): Slide {
  return {
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    url: URL.createObjectURL(file),
    ...emptySlideState,
  };
}

function fileFromCanvas(canvas: HTMLCanvasElement, name: string) {
  return new Promise<File>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Could not prepare edited image.'));
        return;
      }
      resolve(new File([blob], name, { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.92);
  });
}

async function exportSlide(slide: Slide, index: number) {
  const image = new Image();
  image.src = slide.url;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not edit image.');

  ctx.fillStyle = '#0a0800';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((slide.rotation * Math.PI) / 180);
  ctx.translate((slide.cropX / 100) * canvas.width, (slide.cropY / 100) * canvas.height);
  ctx.filter = `brightness(${0.5 + slide.brightness / 100}) contrast(${0.5 + slide.contrast / 80}) saturate(${slide.saturation / 50})`;

  const scale = Math.max(canvas.width / image.width, canvas.height / image.height) * (slide.zoom / 100);
  const width = image.width * scale;
  const height = image.height * scale;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  ctx.restore();

  if (slide.text.trim()) {
    ctx.font = '700 64px Inter, Arial, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0,0,0,0.72)';
    ctx.fillStyle = '#f0e8d0';
    const text = slide.text.trim().slice(0, 48);
    ctx.strokeText(text, 56, canvas.height - 56);
    ctx.fillText(text, 56, canvas.height - 56);
  }

  return fileFromCanvas(canvas, `jwala-lakshmi-slide-${index + 1}.jpg`);
}

export default function PostPage() {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [draggingCrop, setDraggingCrop] = useState(false);
  const [privateList, setPrivateList] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Rings');
  const [metal, setMetal] = useState('Platinum 950');
  const [price, setPrice] = useState('');
  const [stone, setStone] = useState('Diamond');
  const [carat, setCarat] = useState('');
  const [weight, setWeight] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const activeSlide = slides[activeIndex] || null;
  const canAddMore = slides.length < 4;

  const previewStyle = useMemo(() => {
    if (!activeSlide) return undefined;
    return {
      filter: `brightness(${0.5 + activeSlide.brightness / 100}) contrast(${0.5 + activeSlide.contrast / 80}) saturate(${activeSlide.saturation / 50})`,
      transform: `rotate(${activeSlide.rotation}deg) translate(${activeSlide.cropX}%, ${activeSlide.cropY}%) scale(${activeSlide.zoom / 100})`,
    };
  }, [activeSlide]);

  useEffect(() => {
    if (getToken()) {
      apiFetch<User>('/auth/me')
        .then(setCurrentUser)
        .catch(() => undefined);
    }
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const updateSlide = (patch: Partial<Slide>) => {
    setSlides(current => current.map((slide, index) => index === activeIndex ? { ...slide, ...patch } : slide));
  };

  const dragCrop = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingCrop || !activeSlide) return;
    updateSlide({
      cropX: Math.max(-40, Math.min(40, activeSlide.cropX + event.movementX / 4)),
      cropY: Math.max(-40, Math.min(40, activeSlide.cropY + event.movementY / 4)),
    });
  };

  const addFiles = (files: FileList | File[] | null) => {
    if (!files?.length) return;
    setError('');
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (!imageFiles.length) {
      setError('Choose image files only.');
      return;
    }
    setSlides(current => {
      const next = [...current, ...imageFiles.slice(0, 4 - current.length).map(makeSlide)];
      if (!current.length) setActiveIndex(0);
      if (imageFiles.length + current.length > 4) setMessage('Only the first 4 images were added.');
      return next;
    });
  };

  const openCamera = async () => {
    setError('');
    if (!canAddMore) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access is not available in this browser. Use Upload instead.');
      return;
    }

    setCameraOpen(true);
    setCameraLoading(true);
    try {
      streamRef.current?.getTracks().forEach(track => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraOpen(false);
      setError(err instanceof Error ? `Camera access failed: ${err.message}` : 'Camera access failed.');
    } finally {
      setCameraLoading(false);
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1200;
    canvas.height = video.videoHeight || 1200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const file = await fileFromCanvas(canvas, `camera-slide-${Date.now()}.jpg`);
    addFiles([file]);
    closeCamera();
  };

  const removeSlide = (index: number) => {
    setSlides(current => current.filter((_, itemIndex) => itemIndex !== index));
    setActiveIndex(current => Math.max(0, Math.min(current, slides.length - 2)));
  };

  const spec = [metal, stone !== 'None' ? stone : '', carat ? `${carat}ct` : '', weight ? `${weight}g` : '', `${slides.length || 1} slide${slides.length === 1 ? '' : 's'}`, privateList ? 'Private' : 'Marketplace']
    .filter(Boolean)
    .join(' · ');

  const saveDraft = () => {
    localStorage.setItem('jb_post_draft', JSON.stringify({ title, category, metal, price, stone, carat, weight, privateList, slideCount: slides.length }));
    setMessage('Draft saved on this device.');
    setError('');
  };

  const publish = async () => {
    setMessage('');
    setError('');
    if (!title.trim()) {
      setError('Enter a design title before publishing.');
      return;
    }
    if (!slides.length) {
      setError('Add at least one image from camera or upload.');
      return;
    }
    if (!getToken()) {
      setError('You are not signed in. Login again, then publish.');
      return;
    }

    setPublishing(true);
    try {
      const editedFiles = await Promise.all(slides.map(exportSlide));
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('spec', price ? `${spec} · $${price}` : spec);
      editedFiles.forEach(file => formData.append('images', file));

      const product = await apiFetch<Product>('/products', { method: 'POST', body: formData });
      setMessage(`Published ${product.design_id} with ${editedFiles.length} slide${editedFiles.length === 1 ? '' : 's'}.`);
      setTitle('');
      setPrice('');
      setCarat('');
      setWeight('');
      setSlides([]);
      setActiveIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish product.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="main-area">
        <Topbar brand={currentUser?.business_name || 'Post Design'} />
        <main className="page-content">
          <div className="post-header">
            <div className="post-header-text">
              <h2>Post New Design</h2>
              <p>Capture or upload up to 4 product slides, refine each one, then publish to the marketplace.</p>
            </div>
            <div className="post-header-actions">
              <button id="save-draft-btn" className="btn-outline" onClick={saveDraft}>Save Draft</button>
              <button id="publish-btn" className="btn-gold" onClick={publish} disabled={publishing}>
                {publishing ? 'Publishing...' : 'Publish Design'}
              </button>
            </div>
          </div>

          {(message || error) && (
            <p style={{ color: error ? '#ef4444' : 'var(--gold)', marginBottom: 16 }}>{error || message}</p>
          )}

          <div className="post-layout">
            <div className="composer-panel">
              <div
                className={`image-panel ${activeSlide ? 'crop-active' : ''}`}
                onPointerDown={event => {
                  if (!activeSlide) return;
                  setDraggingCrop(true);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={dragCrop}
                onPointerUp={() => setDraggingCrop(false)}
                onPointerCancel={() => setDraggingCrop(false)}
              >
                {activeSlide ? (
                  <>
                    <img src={activeSlide.url} alt="Design preview" style={previewStyle} />
                    {activeSlide.text.trim() && <span className="slide-text-overlay">{activeSlide.text}</span>}
                  </>
                ) : (
                  <div className="empty-uploader">
                    <ImagePlus size={40} />
                    <span>Add camera shot or upload images</span>
                  </div>
                )}
                <div className="raw-badge">{slides.length ? `${activeIndex + 1}/${slides.length}` : '0/4'}</div>
              </div>

              <div className="media-actions">
                <button type="button" className={`media-action ${!canAddMore ? 'disabled' : ''}`} disabled={!canAddMore} onClick={openCamera}>
                  <Camera size={16} />
                  Camera
                </button>

                <button type="button" className={`media-action ${!canAddMore ? 'disabled' : ''}`} disabled={!canAddMore} onClick={() => uploadInputRef.current?.click()}>
                  <Plus size={16} />
                  Upload
                </button>
                <input ref={uploadInputRef} id="gallery-images" type="file" accept="image/*" multiple disabled={!canAddMore} onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
              </div>

              {slides.length > 0 && (
                <div className="slide-strip">
                  {slides.map((slide, index) => (
                    <div key={slide.id} className={`slide-thumb ${index === activeIndex ? 'active' : ''}`} onClick={() => setActiveIndex(index)} role="button" tabIndex={0} onKeyDown={event => event.key === 'Enter' && setActiveIndex(index)}>
                      <img src={slide.url} alt={`Slide ${index + 1}`} />
                      <span>{index + 1}</span>
                      <button className="slide-remove" aria-label="Remove slide" onClick={event => { event.stopPropagation(); removeSlide(index); }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="studio-panel">
              <div className="studio-title">Slide Adjustments</div>

              <button className="btn-ai" disabled={!activeSlide} onClick={() => updateSlide({ brightness: 72, contrast: 58, saturation: 62 })}>
                <Sparkles size={15} />
                Auto-Enhance
              </button>

              <div className="studio-tools">
                <button className="tool-btn" disabled={!activeSlide} onClick={() => updateSlide({ rotation: ((activeSlide?.rotation || 0) + 90) % 360 })}>
                  <RotateCw size={18} />
                  Rotate
                </button>
                <button className="tool-btn" disabled={!activeSlide} onClick={() => activeSlide && updateSlide(emptySlideState)}>
                  <Crop size={18} />
                  Reset
                </button>
              </div>

              <div className="slider-group">
                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-label"><Crop size={14} /> Crop Zoom</span>
                    <span className="slider-val">{activeSlide?.zoom || 100}</span>
                  </div>
                  <input type="range" min={100} max={180} value={activeSlide?.zoom || 100} disabled={!activeSlide} onChange={e => updateSlide({ zoom: +e.target.value })} />
                </div>

                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-label"><Crop size={14} /> Crop X</span>
                    <span className="slider-val">{activeSlide?.cropX || 0}</span>
                  </div>
                  <input type="range" min={-40} max={40} value={activeSlide?.cropX || 0} disabled={!activeSlide} onChange={e => updateSlide({ cropX: +e.target.value })} />
                </div>

                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-label"><Crop size={14} /> Crop Y</span>
                    <span className="slider-val">{activeSlide?.cropY || 0}</span>
                  </div>
                  <input type="range" min={-40} max={40} value={activeSlide?.cropY || 0} disabled={!activeSlide} onChange={e => updateSlide({ cropY: +e.target.value })} />
                </div>

                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-label"><Sun size={14} /> Brightness</span>
                    <span className="slider-val">{activeSlide?.brightness || 0}</span>
                  </div>
                  <input type="range" min={0} max={100} value={activeSlide?.brightness || 0} disabled={!activeSlide} onChange={e => updateSlide({ brightness: +e.target.value })} />
                </div>

                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-label"><Contrast size={14} /> Contrast</span>
                    <span className="slider-val">{activeSlide?.contrast || 0}</span>
                  </div>
                  <input type="range" min={0} max={100} value={activeSlide?.contrast || 0} disabled={!activeSlide} onChange={e => updateSlide({ contrast: +e.target.value })} />
                </div>

                <div className="slider-item">
                  <div className="slider-header">
                    <span className="slider-label"><Droplets size={14} /> Saturation</span>
                    <span className="slider-val">{activeSlide?.saturation || 0}</span>
                  </div>
                  <input type="range" min={0} max={100} value={activeSlide?.saturation || 0} disabled={!activeSlide} onChange={e => updateSlide({ saturation: +e.target.value })} />
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="slide-text"><Type size={12} /> Text Overlay</label>
                <input id="slide-text" className="modal-input" value={activeSlide?.text || ''} disabled={!activeSlide} maxLength={48} onChange={e => updateSlide({ text: e.target.value })} placeholder="Add short label" />
              </div>
            </div>
          </div>

          {cameraOpen && (
            <div className="modal-overlay">
              <div className="camera-sheet" role="dialog" aria-modal="true" aria-label="Camera capture">
                <div className="modal-header">
                  <span className="modal-title">Camera</span>
                  <button className="modal-close" onClick={closeCamera} aria-label="Close"><X size={15} /></button>
                </div>
                <div className="camera-preview">
                  {cameraLoading && <span>Requesting camera access...</span>}
                  <video ref={videoRef} playsInline muted />
                </div>
                <div className="modal-footer">
                  <button className="modal-cancel" onClick={closeCamera}>Cancel</button>
                  <button className="modal-save" onClick={capturePhoto} disabled={cameraLoading || !canAddMore}>Capture Slide</button>
                </div>
              </div>
            </div>
          )}

          <div className="listing-meta">
            <div className="listing-meta-title">
              <AlignLeft size={18} />
              Listing Metadata
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Design Title</label>
                <input id="design-title" className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter design title" />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <div className="select-wrap">
                  <select id="category-select" className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option>Rings</option>
                    <option>Timepieces</option>
                    <option>Chains</option>
                    <option>Bracelets</option>
                    <option>Earrings</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Metal</label>
                <div className="select-wrap">
                  <select id="metal-select" className="form-select" value={metal} onChange={e => setMetal(e.target.value)}>
                    <option>Platinum 950</option>
                    <option>18k Yellow Gold</option>
                    <option>18k White Gold</option>
                    <option>18k Rose Gold</option>
                    <option>Sterling Silver</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Stone Type</label>
                <div className="select-wrap">
                  <select className="form-select" value={stone} onChange={e => setStone(e.target.value)}>
                    <option>Diamond</option>
                    <option>Sapphire</option>
                    <option>Ruby</option>
                    <option>Emerald</option>
                    <option>None</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Carat Weight</label>
                <input className="form-input" type="number" min="0" step="0.01" value={carat} onChange={e => setCarat(e.target.value)} placeholder="2.4" />
              </div>

              <div className="form-group">
                <label className="form-label">Weight (grams)</label>
                <input className="form-input" type="number" min="0" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} placeholder="148" />
              </div>

              <div className="form-group">
                <label className="form-label">Wholesale Price (USD)</label>
                <div className="price-wrap">
                  <span className="currency">$</span>
                  <input id="price-input" className="form-input" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <h4>Private Listing</h4>
                <p>Mark this design as restricted in the listing specification.</p>
              </div>
              <label className="toggle" id="private-toggle">
                <input type="checkbox" checked={privateList} onChange={e => setPrivateList(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
