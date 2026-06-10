import React, { useRef, useEffect } from 'react';

interface AddActivityModalProps {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  category: 'TRANSPORT' | 'FOOD' | 'ENERGY' | 'CONSUMPTION';
  setCategory: React.Dispatch<React.SetStateAction<'TRANSPORT' | 'FOOD' | 'ENERGY' | 'CONSUMPTION'>>;
  amount: string;
  setAmount: React.Dispatch<React.SetStateAction<string>>;
  unit: string;
  setUnit: React.Dispatch<React.SetStateAction<string>>;
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  formError: string;
  handleAddActivity: (e: React.FormEvent) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export default function AddActivityModal({
  isModalOpen,
  setIsModalOpen,
  category,
  setCategory,
  amount,
  setAmount,
  unit,
  setUnit,
  date,
  setDate,
  description,
  setDescription,
  formError,
  handleAddActivity,
  triggerRef
}: AddActivityModalProps): React.JSX.Element | null {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleModalKeyDown = (
    e: KeyboardEvent,
    first: HTMLElement | null,
    last: HTMLElement | null,
    close: () => void
  ) => {
    if (e.key === 'Escape') {
      close();
    }
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first?.focus();
          e.preventDefault();
        }
      }
    }
  };

  useEffect(() => {
    if (!isModalOpen) {
      triggerRef.current?.focus();
      return;
    }

    const modal = modalRef.current;
    if (!modal) return;

    const focusables = modal.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>(
      'button, [href], input, select, textarea, [tabindex="0"]'
    );
    const firstFocusable = focusables.length > 0 ? focusables[0] : null;
    const lastFocusable = focusables.length > 0 ? focusables[focusables.length - 1] : null;

    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      handleModalKeyDown(e, firstFocusable, lastFocusable, () => {
        setIsModalOpen(false);
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [isModalOpen, triggerRef, setIsModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <h2 id="modal-title" style={{ margin: '0 0 20px 0', color: '#fff' }}>Record New Activity</h2>
        {formError && <div className="error-msg" role="alert">{formError}</div>}
        <form onSubmit={handleAddActivity}>
          <div className="form-group">
            <label htmlFor="act-category">Category</label>
            <select
              id="act-category"
              className="form-control"
              value={category}
              onChange={(e) => { setCategory(e.target.value as any); }}
            >
              <option value="TRANSPORT">Transportation</option>
              <option value="FOOD">Food / Dining</option>
              <option value="ENERGY">Home Energy</option>
              <option value="CONSUMPTION">Product Consumption</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="act-amount">Amount</label>
              <input
                id="act-amount"
                type="number"
                step="any"
                className="form-control"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); }}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="act-unit">Unit</label>
              <input
                id="act-unit"
                type="text"
                className="form-control"
                value={unit}
                onChange={(e) => { setUnit(e.target.value); }}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="act-date">Date</label>
            <input
              id="act-date"
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => { setDate(e.target.value); }}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="act-desc">Description</label>
            <input
              id="act-desc"
              type="text"
              className="form-control"
              value={description}
              onChange={(e) => { setDescription(e.target.value); }}
              placeholder="e.g. Flight to London, Steak dinner..."
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="btn-action" style={{ flex: 1 }}>Save Activity</button>
            <button
              type="button"
              className="btn-text"
              style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0 20px' }}
              onClick={() => { setIsModalOpen(false); }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
