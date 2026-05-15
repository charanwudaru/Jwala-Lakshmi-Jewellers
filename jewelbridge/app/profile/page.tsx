'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, EyeOff, LayoutGrid, LayoutList, Trash2, X, LogOut, Camera } from 'lucide-react';
import BottomNav from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { apiFetch, clearSession, type Product, type ProductStatus, type User } from '@/app/lib/api';

interface ProfileData {
  name: string;
  bio: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'JL';
}

function PostImageSlider({ item }: { item: Product }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = item.image_urls?.length ? item.image_urls : [item.image_url];
  const currentImage = slides[Math.min(slideIndex, slides.length - 1)] || item.image_url;

  const moveSlide = (direction: -1 | 1) => {
    setSlideIndex(current => (current + direction + slides.length) % slides.length);
  };

  return (
    <>
      <img src={currentImage} alt={item.title} />
      {slides.length > 1 && (
        <>
          <button className="card-slide-btn left profile-slide-btn" aria-label="Previous image" onClick={event => { event.stopPropagation(); moveSlide(-1); }}>
            <ChevronLeft size={15} />
          </button>
          <button className="card-slide-btn right profile-slide-btn" aria-label="Next image" onClick={event => { event.stopPropagation(); moveSlide(1); }}>
            <ChevronRight size={15} />
          </button>
          <div className="card-slide-count">{slideIndex + 1}/{slides.length}</div>
          <div className="card-slide-dots">
            {slides.map((_, index) => (
              <button key={index} className={index === slideIndex ? 'active' : ''} aria-label={`Show image ${index + 1}`} onClick={event => { event.stopPropagation(); setSlideIndex(index); }} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [editOpen, setEditOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [profileKey, setProfileKey] = useState('');

  const [profile, setProfile] = useState<ProfileData>({
    name: 'Jwala Lakshmi Vendor',
    bio: 'Verified marketplace member.',
    email: '',
    phone: '',
    address: '',
    avatar: '',
  });

  const [draft, setDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    let mounted = true;
    Promise.all([apiFetch<User>('/auth/me'), apiFetch<Product[]>('/products/mine')])
      .then(([user, productRows]) => {
        if (!mounted) return;
        const localProfile = localStorage.getItem(`jb_profile_${user.id}`);
        const saved = localProfile ? JSON.parse(localProfile) as Partial<ProfileData> : {};
        const nextProfile = {
          name: saved.name || user.business_name,
          bio: saved.bio || `${user.role === 'admin' ? 'Administrator' : 'Vendor'} account for ${user.business_name}.`,
          email: user.email,
          phone: user.phone || saved.phone || '',
          address: saved.address || '',
          avatar: saved.avatar || '',
        };
        setProfile(nextProfile);
        setDraft(nextProfile);
        setProfileKey(`jb_profile_${user.id}`);
        setProducts(productRows);
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Could not load profile.';
        setError(message);
        if (/credential|token|unauthorized/i.test(message)) {
          clearSession();
          router.push('/login');
        }
      });
    return () => { mounted = false; };
  }, [router]);

  const openEdit = () => { setDraft(profile); setEditOpen(true); };
  const saveEdit = () => {
    setProfile(draft);
    if (profileKey) localStorage.setItem(profileKey, JSON.stringify(draft));
    setEditOpen(false);
  };
  const set = (key: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft(d => ({ ...d, [key]: e.target.value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setDraft(d => ({ ...d, avatar: url }));
    }
  };

  const signOut = () => {
    clearSession();
    router.push('/login');
  };

  const updateVisibility = async (product: Product, status: ProductStatus) => {
    setError('');
    try {
      const updated = await apiFetch<Product>(`/products/${product.id}/visibility`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setProducts(rows => rows.map(row => row.id === product.id ? updated : row));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update visibility.');
    }
  };

  const deletePost = async (product: Product) => {
    setError('');
    if (!window.confirm(`Delete ${product.title}? This cannot be undone.`)) return;
    try {
      await apiFetch<void>(`/products/${product.id}`, { method: 'DELETE' });
      setProducts(rows => rows.filter(row => row.id !== product.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete post.');
    }
  };

  return (
    <div className="app-shell">
      <div className="main-area">
        <Topbar brand={profile.name} />
        <main className="page-content">
          {error && <p style={{ color: '#ef4444', marginBottom: 16 }}>{error}</p>}

          <div className="prof-card">
            <div className="prof-card-inner">
              <div className="prof-avatar-wrap">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="prof-avatar-img" />
                ) : (
                  <div className="avatar-placeholder">{initials(profile.name)}</div>
                )}
              </div>
              <div className="prof-info">
                <h2 className="prof-name">{profile.name}</h2>
                <p className="prof-bio">{profile.bio}</p>
                <div className="prof-stats">
                  <div className="prof-stat">
                    <span className="prof-stat-num">{products.length}</span>
                    <span className="prof-stat-lbl">My Posts</span>
                  </div>
                </div>
                <div className="prof-actions">
                  <button className="prof-btn-edit" id="edit-profile-btn" onClick={openEdit}>Edit profile</button>
                  <button className="prof-btn-logout" id="logout-btn" onClick={signOut}>
                    <LogOut size={13} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="coll-header">
            <h3 className="coll-title">My Posts</h3>
            <div className="view-toggle">
              <button className={`view-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')} aria-label="Grid view"><LayoutGrid size={16} /></button>
              <button className={`view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} aria-label="List view"><LayoutList size={16} /></button>
            </div>
          </div>

          {view === 'grid' ? (
            <div className="coll-masonry">
              {[0, 1, 2].map(col => (
                <div className="coll-col" key={col}>
                  {products.filter((_, index) => index % 3 === col).map(item => (
                    <div key={item.id} className={`coll-item ${col === 0 ? 'tall' : 'short'}`}>
                      <PostImageSlider item={item} />
                      <span className="coll-badge">{item.status === 'hidden' ? 'HIDDEN' : item.status === 'reserved' ? 'RES' : 'LIVE'}</span>
                      <div className="post-manage">
                        <button onClick={() => updateVisibility(item, item.status === 'hidden' ? 'available' : 'hidden')} aria-label="Toggle visibility">
                          {item.status === 'hidden' ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => deletePost(item)} aria-label="Delete post"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="coll-list">
              {products.map(item => (
                <div key={item.id} className="coll-list-item">
                  <div className="coll-list-img-wrap">
                    <PostImageSlider item={item} />
                  </div>
                  <div className="coll-list-info">
                    <span className="coll-list-title">{item.title}</span>
                    <span className="coll-badge-sm">{item.status === 'hidden' ? 'HIDDEN' : item.status === 'reserved' ? 'RESERVED' : 'LIVE'}</span>
                  </div>
                  <div className="post-list-actions">
                    <button className="btn-sm" onClick={() => updateVisibility(item, item.status === 'hidden' ? 'available' : 'hidden')}>
                      {item.status === 'hidden' ? 'Show' : 'Hide'}
                    </button>
                    <button className="btn-sm danger" onClick={() => deletePost(item)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
      <BottomNav />

      {editOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditOpen(false)}>
          <div className="modal-sheet" role="dialog" aria-modal="true" aria-label="Edit Profile">
            <div className="modal-header">
              <span className="modal-title">Edit Profile</span>
              <button className="modal-close" onClick={() => setEditOpen(false)} aria-label="Close"><X size={15} /></button>
            </div>

            <div className="modal-fields">
              <div className="avatar-edit-section">
                <label className="avatar-edit-wrap" htmlFor="avatar-upload">
                  {draft.avatar ? (
                    <img src={draft.avatar} alt="Profile preview" className="avatar-preview" />
                  ) : (
                    <div className="avatar-placeholder">{initials(draft.name)}</div>
                  )}
                  <div className="avatar-overlay"><Camera size={18} /></div>
                </label>
                <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="edit-name">Display Name</label>
                <input id="edit-name" className="modal-input" value={draft.name} onChange={set('name')} placeholder="Your business name" />
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="edit-bio">Bio</label>
                <textarea id="edit-bio" className="modal-textarea" value={draft.bio} onChange={set('bio')} placeholder="Describe your brand..." />
              </div>

              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="edit-email">Email</label>
                  <input id="edit-email" type="email" className="modal-input" value={draft.email} onChange={set('email')} placeholder="you@example.com" disabled />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="edit-phone">Phone</label>
                  <input id="edit-phone" type="tel" className="modal-input" value={draft.phone} onChange={set('phone')} placeholder="+1 000 000 0000" />
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="edit-address">Address</label>
                <input id="edit-address" className="modal-input" value={draft.address} onChange={set('address')} placeholder="City, Country" />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
              <button id="save-profile-btn" className="modal-save" onClick={saveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
