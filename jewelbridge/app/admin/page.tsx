'use client';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, ChevronLeft, ChevronRight, FileText, Home, Inbox, LogOut, Pencil, Phone, RefreshCw, Search, ShieldAlert, UserPlus, Users } from 'lucide-react';
import { apiFetch, clearSession, statusLabel, type Inquiry, type Product, type RequestStatus, type User } from '@/app/lib/api';

type PriceBook = Record<string, { vendorPrice: string; sellingPrice: string }>;
type AdminTab = 'home' | 'requests' | 'collections' | 'vendors' | 'onboard';

function AdminCollectionCard({ product, selected }: { product: Product; selected?: boolean }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const slides = product.image_urls?.length ? product.image_urls : [product.image_url];
  const currentImage = slides[Math.min(slideIndex, slides.length - 1)] || product.image_url;

  const moveSlide = (direction: -1 | 1) => {
    setSlideIndex(current => (current + direction + slides.length) % slides.length);
  };

  return (
    <article className={`admin-collection-card ${selected ? 'selected' : ''}`}>
      <div className="admin-collection-img">
        <img src={currentImage} alt={product.title} />
        <span className={`coll-badge ${product.status === 'hidden' ? 'hidden' : ''}`}>{product.status === 'hidden' ? 'HIDDEN' : product.status === 'reserved' ? 'RES' : 'LIVE'}</span>
        {slides.length > 1 && (
          <>
            <button className="card-slide-btn left" aria-label="Previous image" onClick={() => moveSlide(-1)}><ChevronLeft size={15} /></button>
            <button className="card-slide-btn right" aria-label="Next image" onClick={() => moveSlide(1)}><ChevronRight size={15} /></button>
            <div className="card-slide-count">{slideIndex + 1}/{slides.length}</div>
            <div className="card-slide-dots">
              {slides.map((_, index) => (
                <button key={index} className={index === slideIndex ? 'active' : ''} aria-label={`Show image ${index + 1}`} onClick={() => setSlideIndex(index)} />
              ))}
            </div>
          </>
        )}
      </div>
      <div className="admin-collection-body">
        <span className="request-id">{product.design_id}</span>
        <h3>{product.title}</h3>
        <p>{product.spec}</p>
        <div className="admin-vendor-box">
          <strong>{product.owner?.business_name || 'Unknown vendor'}</strong>
          <span>{product.owner?.email || 'No email'}</span>
          {product.owner?.phone ? (
            <a className="phone-link" href={`tel:${product.owner.phone}`}><Phone size={13} />{product.owner.phone}</a>
          ) : (
            <span>No phone</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('home');
  const [newVendor, setNewVendor] = useState({ name: '', email: '', phone: '' });
  const [onboardSuccess, setOnboardSuccess] = useState(false);
  const [onboardError, setOnboardError] = useState('');
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [vendors, setVendors] = useState<User[]>([]);
  const [requests, setRequests] = useState<Inquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [prices, setPrices] = useState<PriceBook>({});
  const [selectedProductId, setSelectedProductId] = useState('');
  const [editingStatusId, setEditingStatusId] = useState('');
  const [editingPrice, setEditingPrice] = useState<{ id: string; field: 'vendorPrice' | 'sellingPrice' } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAdminData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [vendorRows, requestRows, productRows] = await Promise.all([
        apiFetch<User[]>('/admin/vendors'),
        apiFetch<Inquiry[]>('/admin/requests'),
        apiFetch<Product[]>('/products'),
      ]);
      setVendors(vendorRows);
      setRequests(requestRows);
      setProducts(productRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load admin data.';
      setError(message);
      if (/credential|token|unauthorized/i.test(message)) {
        clearSession();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAdminData(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAdminData]);

  const filteredRequests = useMemo(() => {
    const q = query.toLowerCase();
    return requests.filter(req =>
      !q ||
      req.id.toLowerCase().includes(q) ||
      req.product?.title.toLowerCase().includes(q) ||
      req.vendor?.business_name.toLowerCase().includes(q) ||
      req.product?.owner?.business_name.toLowerCase().includes(q) ||
      req.product?.owner?.phone?.toLowerCase().includes(q) ||
      req.status.toLowerCase().includes(q)
    );
  }, [query, requests]);

  const filteredVendors = useMemo(() => {
    const q = query.toLowerCase();
    return vendors.filter(v =>
      !q ||
      v.id.toLowerCase().includes(q) ||
      v.business_name.toLowerCase().includes(q) ||
      v.email.toLowerCase().includes(q) ||
      (v.phone || '').toLowerCase().includes(q)
    );
  }, [query, vendors]);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase();
    return products.filter(product =>
      !q ||
      product.design_id.toLowerCase().includes(q) ||
      product.title.toLowerCase().includes(q) ||
      product.spec.toLowerCase().includes(q) ||
      product.category.toLowerCase().includes(q) ||
      product.status.toLowerCase().includes(q) ||
      product.owner?.business_name.toLowerCase().includes(q) ||
      product.owner?.email.toLowerCase().includes(q) ||
      product.owner?.phone?.toLowerCase().includes(q)
    );
  }, [products, query]);

  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const inProgressCount = requests.filter(req => req.status === 'in_progress').length;
  const liveProducts = products.filter(product => product.status !== 'hidden').length;
  const recentRequests = requests.slice(0, 5);

  const updateStatus = async (id: string, status: RequestStatus) => {
    try {
      const updated = await apiFetch<Inquiry>(`/admin/requests/${id}/status?new_status=${status}`, { method: 'PUT' });
      setRequests(rows => rows.map(row => row.id === id ? updated : row));
      setEditingStatusId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update request status.');
    }
  };

  const openCollection = (product?: Product | null) => {
    if (!product) return;
    setSelectedProductId(product.id);
    setQuery(product.design_id);
    setActiveTab('collections');
  };

  const signOut = () => {
    clearSession();
    router.push('/login');
  };

  const updatePrice = (id: string, field: 'vendorPrice' | 'sellingPrice', value: string) => {
    setPrices(current => ({
      ...current,
      [id]: {
        vendorPrice: current[id]?.vendorPrice || '',
        sellingPrice: current[id]?.sellingPrice || '',
        [field]: value,
      },
    }));
  };

  const profitFor = (id: string) => {
    const vendorPrice = Number(prices[id]?.vendorPrice || 0);
    const sellingPrice = Number(prices[id]?.sellingPrice || 0);
    return sellingPrice - vendorPrice;
  };

  const hasBothPrices = (id: string) => {
    return Boolean(prices[id]?.vendorPrice && prices[id]?.sellingPrice);
  };

  const isEditingPrice = (id: string, field: 'vendorPrice' | 'sellingPrice') => {
    return editingPrice?.id === id && editingPrice.field === field;
  };

  const priceValue = (id: string, field: 'vendorPrice' | 'sellingPrice') => prices[id]?.[field] || '';

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardError('');
    setOnboardLoading(true);
    try {
      const data = await apiFetch<User>('/admin/onboard', {
        method: 'POST',
        body: JSON.stringify({
          email: newVendor.email,
          business_name: newVendor.name,
          phone: newVendor.phone || null,
        }),
      });
      setVendors(rows => [...rows, data]);
      setOnboardLoading(false);
      setOnboardSuccess(true);
      setTimeout(() => {
        setOnboardSuccess(false);
        setNewVendor({ name: '', email: '', phone: '' });
        setActiveTab('vendors');
      }, 1600);
    } catch (err) {
      setOnboardError(err instanceof Error ? err.message : 'Failed to onboard vendor.');
      setOnboardLoading(false);
    }
  };

  const title = activeTab === 'home'
    ? 'Admin Home'
    : activeTab === 'requests'
      ? 'Request Desk'
      : activeTab === 'collections'
        ? 'Collections'
        : activeTab === 'vendors'
          ? 'Vendor Directory'
          : 'Onboard Vendor';

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <ShieldAlert size={20} color="var(--gold)" />
          <div className="brand-text">
            <h1>Jwala Lakshmi Jewellers</h1>
            <span>Admin Control</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <Home size={18} />
            Home
          </button>
          <button className={`admin-nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            <Inbox size={18} />
            Requests
          </button>
          <button className={`admin-nav-item ${activeTab === 'collections' ? 'active' : ''}`} onClick={() => setActiveTab('collections')}>
            <FileText size={18} />
            Collections
          </button>
          <button className={`admin-nav-item ${activeTab === 'vendors' ? 'active' : ''}`} onClick={() => setActiveTab('vendors')}>
            <Users size={18} />
            Vendors
          </button>
          <button className={`admin-nav-item ${activeTab === 'onboard' ? 'active' : ''}`} onClick={() => setActiveTab('onboard')}>
            <UserPlus size={18} />
            Add Vendor
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={signOut}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span className="admin-kicker">Jwala Lakshmi Jewellers</span>
            <h2>{title}</h2>
          </div>
          <div className="admin-header-actions">
            <div className="search-bar" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <Search size={15} />
              <input placeholder="Search requests, collections, vendors..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <button className="icon-btn" aria-label="Refresh" onClick={() => loadAdminData()}><RefreshCw size={18} /></button>
          </div>
        </header>

        <div className="admin-content">
          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading database records...</p>}
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}

          {activeTab === 'home' && (
            <>
              <div className="admin-home-grid">
                <button className="admin-home-tile" onClick={() => setActiveTab('requests')}>
                  <Inbox size={22} />
                  <span>Pending Requests</span>
                  <strong>{pendingCount}</strong>
                </button>
                <button className="admin-home-tile" onClick={() => setActiveTab('requests')}>
                  <BarChart3 size={22} />
                  <span>In Progress</span>
                  <strong>{inProgressCount}</strong>
                </button>
                <button className="admin-home-tile" onClick={() => setActiveTab('vendors')}>
                  <Users size={22} />
                  <span>Active Vendors</span>
                  <strong>{vendors.filter(v => v.is_active).length}</strong>
                </button>
                <button className="admin-home-tile" onClick={() => setActiveTab('collections')}>
                  <FileText size={22} />
                  <span>Live Designs</span>
                  <strong>{liveProducts}</strong>
                </button>
              </div>

              <div className="admin-work-row">
                <section className="admin-home-panel">
                  <div className="admin-section-head">
                    <h3>Recent Requests</h3>
                    <button className="btn-sm" onClick={() => setActiveTab('requests')}>View All</button>
                  </div>
                  <div className="admin-mini-list">
                    {recentRequests.length === 0 && <p>No requests yet.</p>}
                    {recentRequests.map(req => (
                      <div className="admin-mini-item" key={req.id}>
                        <div>
                          <strong>{req.product?.title || 'Deleted product'}</strong>
                          <span>{req.vendor?.business_name || 'Unknown buyer'} - Qty {req.quantity}</span>
                        </div>
                        <span className={`status-badge ${req.status.replace(/_/g, '-')}`}>{statusLabel(req.status)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="admin-home-panel">
                  <div className="admin-section-head">
                    <h3>Quick Actions</h3>
                  </div>
                  <div className="quick-actions">
                    <button className="btn-gold" onClick={() => setActiveTab('onboard')}>Add Vendor</button>
                    <button className="btn-outline" onClick={() => setActiveTab('requests')}>Open Request Desk</button>
                    <button className="btn-outline" onClick={() => setActiveTab('collections')}>View Collections</button>
                    <button className="btn-outline" onClick={() => setActiveTab('vendors')}>View Vendors</button>
                  </div>
                </section>
              </div>
            </>
          )}

          {activeTab === 'collections' && (
            <>
              {selectedProductId && (
                <div className="admin-filter-note">
                  Showing selected collection.
                  <button onClick={() => { setSelectedProductId(''); setQuery(''); }}>Show All</button>
                </div>
              )}
              <div className="admin-collections">
                {filteredProducts.map(product => (
                  <AdminCollectionCard key={product.id} product={product} selected={product.id === selectedProductId} />
                ))}
                {!loading && filteredProducts.length === 0 && (
                  <div className="empty-state">
                    <FileText size={34} />
                    <h3>No collections found</h3>
                    <p>Uploaded vendor designs will appear here with owner details.</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'requests' && (
            <div className="admin-panel">
              <div className="admin-table-wrap">
                <table className="admin-table request-table">
                  <thead>
                    <tr>
                      <th>Req ID</th>
                      <th>Item</th>
                      <th>Design Vendor</th>
                      <th>Requested By</th>
                      <th>Qty</th>
                      <th>Vendor Price</th>
                      <th>Selling Price</th>
                      <th>Profit</th>
                      <th>Status</th>
                      <th aria-label="Edit status"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(req => (
                      <tr key={req.id}>
                        <td data-label="Req ID" className="mono">{req.id.slice(0, 8)}</td>
                        <td data-label="Item">
                          <button className="req-item-button" onClick={() => openCollection(req.product)} disabled={!req.product}>
                            <span>{req.product?.title || 'Deleted product'}</span>
                            {req.product?.design_id && <small>{req.product.design_id}</small>}
                          </button>
                          <div className="req-item-spec">{req.product?.spec || req.customization_notes || 'No specification'}</div>
                        </td>
                        <td data-label="Design Vendor">
                          <div className="req-item-name">{req.product?.owner?.business_name || 'Unknown vendor'}</div>
                          {req.product?.owner?.phone ? (
                            <a className="phone-link" href={`tel:${req.product.owner.phone}`}>{req.product.owner.phone}</a>
                          ) : (
                            <span className="req-item-spec">No phone</span>
                          )}
                        </td>
                        <td data-label="Requested By">{req.vendor?.business_name || req.vendor_id.slice(0, 8)}</td>
                        <td data-label="Qty">{req.quantity}</td>
                        <td data-label="Vendor Price">
                          {isEditingPrice(req.id, 'vendorPrice') ? (
                            <input className="admin-price-input" type="number" min="0" step="0.01" autoFocus placeholder="" value={priceValue(req.id, 'vendorPrice')} onChange={e => updatePrice(req.id, 'vendorPrice', e.target.value)} onBlur={() => setEditingPrice(null)} />
                          ) : (
                            <button className="price-edit-btn" aria-label="Edit vendor price" onClick={() => setEditingPrice({ id: req.id, field: 'vendorPrice' })}>
                              <span>{priceValue(req.id, 'vendorPrice')}</span>
                              <Pencil size={14} />
                            </button>
                          )}
                        </td>
                        <td data-label="Selling Price">
                          {isEditingPrice(req.id, 'sellingPrice') ? (
                            <input className="admin-price-input" type="number" min="0" step="0.01" autoFocus placeholder="" value={priceValue(req.id, 'sellingPrice')} onChange={e => updatePrice(req.id, 'sellingPrice', e.target.value)} onBlur={() => setEditingPrice(null)} />
                          ) : (
                            <button className="price-edit-btn" aria-label="Edit selling price" onClick={() => setEditingPrice({ id: req.id, field: 'sellingPrice' })}>
                              <span>{priceValue(req.id, 'sellingPrice')}</span>
                              <Pencil size={14} />
                            </button>
                          )}
                        </td>
                        <td data-label="Profit">
                          <span className={`profit-value ${profitFor(req.id) < 0 ? 'negative' : ''}`}>
                            {hasBothPrices(req.id) ? profitFor(req.id).toLocaleString(undefined, { maximumFractionDigits: 2 }) : ''}
                          </span>
                        </td>
                        <td data-label="Status"><span className={`status-badge ${req.status.replace(/_/g, '-')}`}>{statusLabel(req.status)}</span></td>
                        <td data-label="Edit">
                          {editingStatusId === req.id ? (
                            <select className="form-select status-edit-select" value={req.status} onChange={e => updateStatus(req.id, e.target.value as RequestStatus)} onBlur={() => setEditingStatusId('')}>
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="fulfilled">Fulfilled</option>
                            </select>
                          ) : (
                            <button className="status-edit-btn" aria-label="Edit request status" onClick={() => setEditingStatusId(req.id)}>
                              <Pencil size={15} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {!loading && filteredRequests.length === 0 && <tr><td colSpan={10}>No requests found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'vendors' && (
            <div className="admin-panel">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Vendor ID</th>
                      <th>Business Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map(v => (
                      <tr key={v.id}>
                        <td className="mono">{v.id.slice(0, 8)}</td>
                        <td><strong>{v.business_name}</strong></td>
                        <td>{v.email}</td>
                        <td>{v.phone ? <a className="phone-link" href={`tel:${v.phone}`}>{v.phone}</a> : '-'}</td>
                        <td><span className="status-badge active">{v.is_active ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                    {!loading && filteredVendors.length === 0 && <tr><td colSpan={5}>No vendors found.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'onboard' && (
            <div className="admin-panel">
              <div className="admin-form-wrap">
                {onboardSuccess ? (
                  <div className="req-success">
                    <div className="req-success-icon">*</div>
                    <h3>Vendor Onboarded</h3>
                    <p>Their account is active. They can login with <strong>Password@123</strong> and will be prompted to change it.</p>
                  </div>
                ) : (
                  <form className="admin-form" onSubmit={handleOnboard}>
                    <h3>Create Vendor Profile</h3>
                    <p>The vendor will be assigned a temporary password: <strong style={{color: 'var(--gold)'}}>Password@123</strong></p>
                    <div className="form-field">
                      <label htmlFor="v-name">Business / Vendor Name</label>
                      <input id="v-name" className="field-input" required placeholder="e.g. Sri Lakshmi Chains" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} />
                    </div>
                    <div className="modal-row">
                      <div className="form-field">
                        <label htmlFor="v-email">Primary Email</label>
                        <input id="v-email" type="email" className="field-input" required placeholder="vendor@example.com" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="v-phone">Contact Phone</label>
                        <input id="v-phone" type="tel" className="field-input" placeholder="+91 00000 00000" value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} />
                      </div>
                    </div>
                    {onboardError && <p style={{color:'#ef4444', fontSize:13, margin: '0 0 8px'}}>{onboardError}</p>}
                    <button type="submit" className="btn-login" style={{ width: 'auto', padding: '12px 32px' }} disabled={onboardLoading}>
                      {onboardLoading ? 'Creating Account...' : 'Create Vendor Account'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
