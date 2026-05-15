'use client';
import { X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import type { ProductStatus } from '@/app/lib/api';

export interface ProductFilters {
  statuses: ProductStatus[];
  metals: string[];
  stones: string[];
  minCarat: string;
  maxCarat: string;
  minWeight: string;
  maxWeight: string;
}

export const emptyFilters: ProductFilters = {
  statuses: [],
  metals: [],
  stones: [],
  minCarat: '',
  maxCarat: '',
  minWeight: '',
  maxWeight: '',
};

interface FilterModalProps {
  filters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClose: () => void;
}

export default function FilterModal({ filters, onApply, onClose }: FilterModalProps) {
  const [draft, setDraft] = useState<ProductFilters>(filters);

  const toggle = (key: 'statuses' | 'metals' | 'stones', value: string) => {
    setDraft(current => {
      const values = current[key] as string[];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter(item => item !== value) : [...values, value],
      };
    });
  };

  const chipClass = (key: 'statuses' | 'metals' | 'stones', value: string) =>
    `filter-chip${(draft[key] as string[]).includes(value) ? ' active' : ''}`;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-label="Advanced Filters">
        <div className="modal-header">
          <span className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={16} /> Filters
          </span>
          <button className="modal-close" onClick={onClose} aria-label="Close"><X size={15} /></button>
        </div>

        <div className="modal-fields filter-scroll-area">
          <div className="filter-section">
            <h4 className="filter-title">Status</h4>
            <div className="filter-chips">
              <button className={chipClass('statuses', 'available')} onClick={() => toggle('statuses', 'available')}>Available</button>
              <button className={chipClass('statuses', 'reserved')} onClick={() => toggle('statuses', 'reserved')}>Reserved</button>
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">Primary Metal</h4>
            <div className="filter-chips">
              {['18k Yellow Gold', '18k White Gold', '18k Rose Gold', 'Platinum 950', 'Sterling Silver'].map(metal => (
                <button key={metal} className={chipClass('metals', metal)} onClick={() => toggle('metals', metal)}>{metal}</button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">Stone Type</h4>
            <div className="filter-chips">
              {['Diamond', 'Sapphire', 'Ruby', 'Emerald', 'None'].map(stone => (
                <button key={stone} className={chipClass('stones', stone)} onClick={() => toggle('stones', stone)}>{stone}</button>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">Carat Weight</h4>
            <div className="filter-range">
              <input type="number" placeholder="Min" className="modal-input" value={draft.minCarat} onChange={e => setDraft(d => ({ ...d, minCarat: e.target.value }))} />
              <span>-</span>
              <input type="number" placeholder="Max" className="modal-input" value={draft.maxCarat} onChange={e => setDraft(d => ({ ...d, maxCarat: e.target.value }))} />
            </div>
          </div>

          <div className="filter-section">
            <h4 className="filter-title">Weight (Grams)</h4>
            <div className="filter-range">
              <input type="number" placeholder="Min" className="modal-input" value={draft.minWeight} onChange={e => setDraft(d => ({ ...d, minWeight: e.target.value }))} />
              <span>-</span>
              <input type="number" placeholder="Max" className="modal-input" value={draft.maxWeight} onChange={e => setDraft(d => ({ ...d, maxWeight: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '24px' }}>
          <button className="modal-cancel" onClick={() => { onApply(emptyFilters); onClose(); }}>Clear All</button>
          <button className="modal-save" onClick={() => { onApply(draft); onClose(); }}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
}
