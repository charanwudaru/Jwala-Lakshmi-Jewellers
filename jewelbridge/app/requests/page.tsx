'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, RefreshCw, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { apiFetch, clearSession, statusLabel, type Inquiry, type User } from '@/app/lib/api';

export default function VendorRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<Inquiry[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rows, user] = await Promise.all([
        apiFetch<Inquiry[]>('/requests/mine'),
        apiFetch<User>('/auth/me'),
      ]);
      setRequests(rows);
      setCurrentUser(user);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load your requests.';
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
      void loadRequests();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(req => {
      const product = req.product;
      const haystack = [
        req.id,
        req.status,
        req.customization_notes,
        product?.title,
        product?.spec,
        product?.design_id,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [query, requests]);

  return (
    <div className="app-shell">
      <div className="main-area">
        <Topbar brand={currentUser?.business_name || 'My Requests'} query={query} onQueryChange={setQuery} />
        <main className="page-content">
          <div className="requests-head">
            <div>
              <span className="page-kicker">Vendor Requests</span>
              <h2>My Requests</h2>
              <p>Track every design request you sent and see the latest admin status.</p>
            </div>
            <button className="icon-btn" aria-label="Refresh requests" onClick={loadRequests}>
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="requests-search">
            <Search size={15} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search requests, designs, status..." />
          </div>

          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading your requests...</p>}
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}

          {!loading && !error && filteredRequests.length === 0 && (
            <div className="empty-state">
              <ClipboardList size={34} />
              <h3>No requests found</h3>
              <p>Requests you send from design cards will appear here with their status.</p>
            </div>
          )}

          <div className="request-list">
            {filteredRequests.map(req => (
                <article className="request-card" key={req.id}>
                  <div className="request-thumb">
                    {req.product?.image_url ? (
                      <img src={req.product.image_url} alt={req.product.title} />
                    ) : (
                      <ClipboardList size={24} />
                    )}
                  </div>
                  <div className="request-main">
                    <div className="request-title-row">
                      <div>
                        <span className="request-id">{req.product?.design_id || req.id.slice(0, 8)}</span>
                        <h3>{req.product?.title || 'Deleted product'}</h3>
                      </div>
                      <span className={`status-badge ${req.status.replace(/_/g, '-')}`}>{statusLabel(req.status)}</span>
                    </div>

                    <p className="request-spec">{req.product?.spec || 'No specification available'}</p>

                    <div className="request-meta-grid">
                      <div>
                        <span>Quantity</span>
                        <strong>{req.quantity}</strong>
                      </div>
                    </div>

                    {req.customization_notes && (
                      <p className="request-notes">{req.customization_notes}</p>
                    )}
                  </div>
                </article>
            ))}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
