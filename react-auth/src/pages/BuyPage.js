import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/BuyPage.css';

const API = 'http://localhost:3000';

function BuyPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [user,        setUser]        = useState(null);
  const [item,        setItem]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [confirmed,   setConfirmed]   = useState(false);   // true after successful confirm
  const [sellerEmail, setSellerEmail] = useState('');
  const [toast,       setToast]       = useState({ show: false, msg: '', type: 'success' });

  // Form state
  const [interaction, setInteraction] = useState('chat_first');
  const [pickupTime,  setPickupTime]  = useState('Afternoon');
  const [note,        setNote]        = useState('');

  // Auth check
  useEffect(() => {
    const stored = localStorage.getItem('campusmart_user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  // Load item via GET /items/:id
  useEffect(() => {
    if (!id) { setError('No item specified.'); setLoading(false); return; }
    fetch(`${API}/items/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.item) setItem(data.item);
        else setError('Item not found or no longer available.');
      })
      .catch(() => setError('Could not load item. Check your connection.'))
      .finally(() => setLoading(false));
  }, [id]);

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  // ── Confirm Purchase — show success, do NOT open chat automatically ──────
  async function handleConfirm() {
    if (!item || !user) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`${API}/api/purchase`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          itemId:      item._id,
          buyerEmail:  user.email,
          interaction,
          pickupTime,
          note: note.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Could not send request.', 'error');
        setSubmitting(false);
        return;
      }

      // Save seller email for the Open Chat button
      setSellerEmail(data.sellerEmail || item.sellerEmail || '');

      // Show success state — do NOT open chat automatically
      setConfirmed(true);
      setSubmitting(false);

    } catch {
      showToast('Network error. Please try again.', 'error');
      setSubmitting(false);
    }
  }

  // ── Open Chat — only called when user explicitly clicks the button ────────
  function handleOpenChat() {
    if (!item) return;
    const se  = sellerEmail || item.sellerEmail || '';
    const sn  = se.split('@')[0] || 'Seller';
    const img = (item.images && item.images[0]) || item.image || '';
    window.location.href = `${API}/chat.html`
      + `?itemId=${encodeURIComponent(item._id)}`
      + `&otherEmail=${encodeURIComponent(se)}`
      + `&otherName=${encodeURIComponent(sn)}`
      + `&itemName=${encodeURIComponent(item.name)}`
      + `&itemImage=${encodeURIComponent(img)}`;
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bp-loading">
        <div className="bp-spinner" />
        <p>Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bp-error">
        <div className="bp-error-icon">⚠️</div>
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button className="bp-btn-back" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const sEmail     = item.sellerEmail || '';
  const sName      = sEmail.split('@')[0] || 'Seller';
  const imgSrc     = item.images?.length
    ? `${API}/uploads/${item.images[0]}`
    : item.image ? `${API}/uploads/${item.image}` : null;
  const isExchange = item.deal_type === 'exchange';

  return (
    <div className="bp-page">

      {/* Toast */}
      {toast.show && (
        <div className={`bp-toast bp-toast-${toast.type}`}>{toast.msg}</div>
      )}

      {/* Navbar */}
      <nav className="bp-nav">
        <div className="bp-nav-brand">Campus<span>Mart</span></div>
        {user && (
          <div className="bp-nav-user">
            <div className="bp-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span className="bp-username">{user.name}</span>
          </div>
        )}
      </nav>

      <div className="bp-container">

        <button className="bp-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to item
        </button>

        <div className="bp-grid">

          {/* LEFT — item summary */}
          <div className="bp-item-card">
            {imgSrc
              ? <img className="bp-item-img" src={imgSrc} alt={item.name}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              : null}
            <div className="bp-item-img-placeholder" style={{ display: imgSrc ? 'none' : 'flex' }}>
              📦
            </div>
            <div className="bp-item-info">
              <div className="bp-item-category">{item.category}</div>
              <div className="bp-item-title">{item.name}</div>
              {isExchange
                ? <div className="bp-item-price bp-exchange">🔄 Exchange for: {item.exchange_for || 'Open to offers'}</div>
                : <div className="bp-item-price">₹{Number(item.price).toLocaleString()}</div>
              }
              <div className="bp-item-chips">
                <span className={`bp-chip bp-cond-${(item.condition || '').toLowerCase()}`}>{item.condition}</span>
                <span className="bp-chip">{item.subject}</span>
              </div>
              <div className="bp-seller-row">
                <div className="bp-seller-avatar">{sName.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="bp-seller-label">Seller</div>
                  <div className="bp-seller-name">{sName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — form OR success */}
          <div className="bp-form-card">

            {/* ── SUCCESS STATE — shown after confirm ── */}
            {confirmed ? (
              <div className="bp-success">
                <div className="bp-success-icon">✅</div>
                <h2 className="bp-success-title">Purchase Request Sent Successfully!</h2>
                <p className="bp-success-msg">
                  Your request has been sent to the seller.<br />
                  You can now open a chat to coordinate the handover,
                  or go back to browse more items.
                </p>
                <div className="bp-success-actions">
                  <button className="bp-btn-open-chat" onClick={handleOpenChat}>
                    💬 Open Chat
                  </button>
                  <button className="bp-btn-home" onClick={() => navigate('/dashboard')}>
                    🏠 Back to Home
                  </button>
                </div>
              </div>
            ) : (
              /* ── FORM — shown before confirm ── */
              <>
                <h2 className="bp-form-title">🛒 Place Your Request</h2>
                <p className="bp-form-subtitle">
                  No payment needed — coordinate directly with the seller on campus.
                </p>

                <div className="bp-divider" />

                {/* Preferred Interaction */}
                <div className="bp-field">
                  <label className="bp-label">Preferred Interaction</label>
                  <div className="bp-radio-group">
                    <label className={`bp-radio ${interaction === 'meet_campus' ? 'bp-radio-active' : ''}`}>
                      <input type="radio" name="interaction" value="meet_campus"
                        checked={interaction === 'meet_campus'}
                        onChange={() => setInteraction('meet_campus')} />
                      <span className="bp-radio-icon">🏫</span>
                      <span className="bp-radio-text">
                        <strong>Meet in campus</strong>
                        <small>Arrange a face-to-face handover</small>
                      </span>
                    </label>
                    <label className={`bp-radio ${interaction === 'chat_first' ? 'bp-radio-active' : ''}`}>
                      <input type="radio" name="interaction" value="chat_first"
                        checked={interaction === 'chat_first'}
                        onChange={() => setInteraction('chat_first')} />
                      <span className="bp-radio-icon">💬</span>
                      <span className="bp-radio-text">
                        <strong>Chat with seller first</strong>
                        <small>Discuss details before meeting</small>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Pickup Time */}
                <div className="bp-field">
                  <label className="bp-label" htmlFor="pickup-time">Preferred Pickup Time</label>
                  <select id="pickup-time" className="bp-select"
                    value={pickupTime} onChange={e => setPickupTime(e.target.value)}>
                    <option value="Morning">☀️ Morning</option>
                    <option value="Afternoon">🌤️ Afternoon</option>
                    <option value="Evening">🌙 Evening</option>
                  </select>
                </div>

                {/* Note */}
                <div className="bp-field">
                  <label className="bp-label" htmlFor="note">
                    Note to Seller <span className="bp-optional">(optional)</span>
                  </label>
                  <textarea id="note" className="bp-textarea"
                    placeholder="e.g. Can we meet near the library? I'm free after 3pm."
                    maxLength={300} rows={3}
                    value={note} onChange={e => setNote(e.target.value)} />
                  <div className="bp-char-count">{note.length}/300</div>
                </div>

                <div className="bp-divider" />

                {/* Buttons */}
                <div className="bp-actions">
                  <button className="bp-btn-cancel" onClick={() => navigate(-1)} disabled={submitting}>
                    Cancel
                  </button>
                  <button className="bp-btn-confirm" onClick={handleConfirm} disabled={submitting}>
                    {submitting ? <><span className="bp-spinner-sm" /> Sending...</> : '✓ Confirm Purchase'}
                  </button>
                </div>

                <div className="bp-notice">
                  🔒 No payment required — campus coordination only.
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyPage;
