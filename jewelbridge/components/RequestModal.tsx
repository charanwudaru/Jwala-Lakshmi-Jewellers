'use client';
import { X, Send } from 'lucide-react';
import { useState } from 'react';
import { apiFetch, type Inquiry } from '@/app/lib/api';

interface RequestModalProps {
  productId: string;
  title: string;
  spec: string;
  onClose: () => void;
}

export default function RequestModal({ productId, title, spec, onClose }: RequestModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch<Inquiry>('/requests', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          quantity: Math.max(1, Number(quantity) || 1),
          customization_notes: notes || null,
        }),
      });
      setSubmitted(true);
      setTimeout(() => { onClose(); }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-label="Request Design">
        {!submitted ? (
          <>
            <div className="modal-header">
              <span className="modal-title">Request Design</span>
              <button className="modal-close" onClick={onClose} aria-label="Close"><X size={15} /></button>
            </div>

            <div className="req-summary">
              <div className="req-summary-info">
                <span className="req-item-title">{title}</span>
                <span className="req-item-spec">{spec}</span>
              </div>
            </div>

            <form className="modal-fields" onSubmit={handleSubmit}>
              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label" htmlFor="req-qty">Quantity</label>
                  <input
                    id="req-qty"
                    type="number"
                    min="1"
                    className="modal-input"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="req-deadline">Deadline</label>
                  <input
                    id="req-deadline"
                    type="date"
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="req-customisation">Customisation Notes</label>
                <textarea
                  id="req-customisation"
                  className="modal-textarea"
                  placeholder="Describe any modifications - metal type, stone colour, engraving, sizing..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-field">
                <label className="modal-label" htmlFor="req-contact">Your Contact / Business Name</label>
                <input
                  id="req-contact"
                  className="modal-input"
                  placeholder="e.g. Store Manager - JL-994"
                />
              </div>

              {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}

              <div className="modal-footer">
                <button type="button" className="modal-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" id="submit-request-btn" className="modal-save" disabled={loading}>
                  <Send size={13} style={{ marginRight: 6 }} />
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="req-success">
            <div className="req-success-icon">*</div>
            <h3>Request Sent!</h3>
            <p>Your enquiry for <strong>{title}</strong> has been forwarded. You will receive a response within 24 hours.</p>
          </div>
        )}
      </div>
    </div>
  );
}
