'use client';
import { useEffect, useMemo, useState } from 'react';
import { Diamond, Clock, Link2, Circle, Star, SlidersHorizontal } from 'lucide-react';
import BottomNav from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import ProductCard from '@/components/ProductCard';
import FilterModal, { emptyFilters, type ProductFilters } from '@/components/FilterModal';
import { apiFetch, clearSession, type Product, type User } from '@/app/lib/api';
import { useRouter } from 'next/navigation';

const categories = [
  { label: 'All Collections', icon: Diamond },
  { label: 'Timepieces', icon: Clock },
  { label: 'Chains', icon: Link2 },
  { label: 'Rings', icon: Circle },
  { label: 'Bracelets', icon: Star },
];

function numberInRange(spec: string, unitPattern: RegExp, min: string, max: string) {
  if (!min && !max) return true;
  const match = spec.match(unitPattern);
  if (!match) return false;
  const value = Number(match[1]);
  if (min && value < Number(min)) return false;
  if (max && value > Number(max)) return false;
  return true;
}

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('All Collections');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(emptyFilters);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiFetch<Product[]>('/products'),
      apiFetch<User>('/auth/me'),
    ])
      .then(([items, user]) => {
        if (!mounted) return;
        setProducts(items);
        setCurrentUser(user);
      })
      .catch(err => {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'Could not load marketplace.';
        setError(message);
        if (/credential|token|unauthorized/i.test(message)) {
          clearSession();
          router.push('/login');
        }
      })
      .finally(() => mounted && setLoading(false));

    return () => { mounted = false; };
  }, [router]);

  const filtered = useMemo(() => {
    return products.filter(product => {
      if (product.status === 'hidden') return false;
      if (currentUser?.role === 'vendor' && product.owner_id === currentUser.id) return false;
      const haystack = `${product.title} ${product.spec} ${product.category} ${product.design_id}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (activeCategory !== 'All Collections' && product.category !== activeCategory) return false;
      if (filters.statuses.length && !filters.statuses.includes(product.status)) return false;
      if (filters.metals.length && !filters.metals.some(metal => haystack.includes(metal.toLowerCase()))) return false;
      if (filters.stones.length && !filters.stones.some(stone => stone === 'None' ? !/diamond|sapphire|ruby|emerald/i.test(product.spec) : haystack.includes(stone.toLowerCase()))) return false;
      if (!numberInRange(product.spec, /([\d.]+)\s*ct/i, filters.minCarat, filters.maxCarat)) return false;
      if (!numberInRange(product.spec, /([\d.]+)\s*g/i, filters.minWeight, filters.maxWeight)) return false;
      return true;
    });
  }, [activeCategory, currentUser, filters, products, query]);

  return (
    <div className="app-shell">
      <div className="main-area">
        <Topbar brand={currentUser?.business_name} query={query} onQueryChange={setQuery} />
        <main className="page-content">
          <div className="category-tabs-wrap">
            <div className="category-tabs">
              {categories.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  id={`cat-${label.toLowerCase().replace(' ', '-')}`}
                  className={`cat-tab${activeCategory === label ? ' active' : ''}`}
                  onClick={() => setActiveCategory(label)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
            <button className="filter-btn" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal size={14} />
              Filters
            </button>
          </div>

          {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading real listings...</p>}
          {error && <p style={{ color: '#ef4444' }}>{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>No designs from other vendors match the selected options.</p>
          )}

          <div className="product-grid">
            {filtered.map((product, index) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.image_url}
                imageUrls={product.image_urls}
                status={product.status}
                title={product.title}
                spec={product.spec}
                views={`${index + 1}`}
              />
            ))}
          </div>
        </main>
      </div>
      <BottomNav />

      {filterOpen && <FilterModal filters={filters} onApply={setFilters} onClose={() => setFilterOpen(false)} />}
    </div>
  );
}
