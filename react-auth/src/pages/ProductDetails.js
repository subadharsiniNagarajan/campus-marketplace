import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/ProductDetails.css';

const API = 'http://localhost:3000';

function ProductDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();   // <-- useNavigate imported and used here

  const [user,       setUser]       = useState(null);
  const [item,       setItem]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [imgIndex,   setImgIndex]   = useState(0);
  const [inWishlist, setInWishlist] = useState(false);
  const [toast,      setToast]      = useState({ show: false, msg: '', type: 'success' });

  // Auth guard
  useEffect(() => {
    const stored = localStorage.getItem('campusmart_user');
    if (!stored) { navigate('/login'); return; }
    setUser(JSON.parse(stored));
  }, [navigate]);

  // Fetch item by ID
  useEffect(() => {
    if (!id) { setError('No item specified.'); setLoading(false); return; }
    fetch(`${API}/items/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.item) {
          setItem(data.item);
          const wl = JSON.parse(localStorage.getItem('campusmart_wishlist') || '[]');
          setInWishlist(wl.includes(data.item._id));
        } else {
          setError('Item not found or no longer available.');
        }
      })
      .catch(() => setError('Could not load item. Check your connection.'))
      .finally(() => setLoading(false));
  }, [id]);

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  // Message Seller
  async function handleMessageSeller() {
    if (!item || !user) return;
    try {
      const res  = await fetch(`${API}/api/chat/open`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ itemId: item._id, buyerEmail: user.email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const img = (item.images && item.images[0]) || item.image || '';
        window.location.href = `${API}/chat.html`
          + `?itemId=${encodeURIComponent(item._id)}`
          + `&otherEmail=${encodeURIComponent(data.sellerEmail)}`
          + `&otherName=${encodeURIComponent(data.sellerName || data.sellerEmail)}`
          + `&itemName=${encodeURIComponent(item.name)}`
          + `&itemImage=${encodeURIComponent(img)}`;
      } else {
        showToast(data.error || 'Could not open chat.', 'error');
      }
    } catch {
      showToast('Network error.', 'error');
    }
  }

  // Wishlist
  function toggleWishlist() {
    if (!item) return;
    const wl  = JSON.parse(localStorage.getItem('campusmart_wishlist') || '[]');
    const idx = wl.indexOf(item._id);
    if (idx > -1) { wl.splice(idx, 1); setInWishlist(false); showToast('Removed from wishlist'); }
    else          { wl.push(item._id); setInWishlist(true);  showToast('Added to wishlist'); }
    localStorage.setItem('campusmart_wishlist', JSON.stringify(wl));
  }

  // Mark as Sold
  async function handleMarkSold() {
    if (!item || !window.confirm('Mark this item as SOLD?')) return;
    try {
      const res  = await fetch(`${API}/items/${item._id}/sold`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (res.ok) { setItem(prev => ({ ...prev, sold: true })); showToast('Item marked as sold'); }
      else        { showToast(data.error || 'Failed.', 'error'); }
    } catch { showToast('Network error.', 'error'); }
  }

  // Loading / error states
  if (loading) {
    return (
      <div className="pd-loading">
        <div className="pd-spinner" />
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pd-error">
        <div className="pd-error-icon">⚠️</div>
        <h3>Product Not Found</h3>
        <p>{error}</p>
        <button className="pd-btn-back" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const images      = item.images?.length
    ? item.images.map(img => `${API}/uploads/${img}`)
    : item.image ? [`${API}/uploads/${item.image}`] : [];
  const sellerEmail = item.sellerEmail || '';
  const sellerName  = sellerEmail.split('@')[0] || 'Seller';
  const isOwn       = user && item.user_id && item.user_id.toString() === user.id;
  const isSold      = item.sold;
  const isExchange  = item.deal_type === 'exchange';
  const condClass   = { New: 'pd-cond-new', Good: 'pd-cond-good', Used: 'pd-cond-used' };

  return (
    <div className="pd-page">

      {toast.show && (
        <div className={`pd-toast pd-toast-${toast.type}`}>{toast.msg}</div>
      )}

      <nav className="pd-nav">
        <div className="pd-nav-brand">Campus<span>Mart</span></div>
        {user && (
          <div className="pd-nav-user">
            <div className="pd-avatar">{user.name.charAt(0).toUpperCase()}</div>
            <span className="pd-username">{user.name}</span>
            <button className="pd-btn-logout" onClick={() => {
              localStorage.removeItem('campusmart_user');
              navigate('/login');
            }}>Logout</button>
          </div>
        )}
      </nav>

      <div className="pd-container">

        <button className="pd-back" onClick={() => navigate(-1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Browse
        </button>

        <div className="pd-grid">

          {/* LEFT — image carousel */}
          <div className="pd-left">
            <div className="pd-carousel">
              {images.length > 0
                ? <img className="pd-main-img" src={images[imgIndex]} alt={item.name}
                    onError={e => { e.target.style.display = 'none'; }} />
                : <div className="pd-img-placeholder">📦</div>
              }
              {images.length > 1 && (
                <>
                  <button className="pd-carousel-btn pd-prev"
                    onClick={() => setImgIndex(i => (i - 1 + images.length) % images.length)}>‹</button>
                  <button className="pd-carousel-btn pd-next"
                    onClick={() => setImgIndex(i => (i + 1) % images.length)}>›</button>
                  <div className="pd-indicators">
                    {images.map((_, i) => (
                      <span key={i} className={`pd-dot ${i === imgIndex ? 'pd-dot-active' : ''}`}
                        onClick={() => setImgIndex(i)} />
                    ))}
                  </div>
                  <div className="pd-thumbs">
                    {images.map((src, i) => (
                      <img key={i} src={src} alt=""
                        className={`pd-thumb ${i === imgIndex ? 'pd-thumb-active' : ''}`}
                        onClick={() => setImgIndex(i)}
                        onError={e => { e.target.style.display = 'none'; }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT — product info */}
          <div className="pd-right">
            <div className="pd-info-card">

              <div className="pd-category-badge">{item.category}</div>
              <h1 className="pd-title">{item.name}</h1>
              <div className="pd-subject">📖 {item.subject}</div>

              <div className="pd-price-section">
                {isExchange ? (
                  <div className="pd-exchange-badge">
                    <span className="pd-exchange-icon">🔄</span>
                    <div>
                      <div className="pd-exchange-label">Exchange For</div>
                      <div className="pd-exchange-value">{item.exchange_for || 'Open to offers'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="pd-price">₹{Number(item.price).toLocaleString()}</div>
                )}
              </div>

              <div className="pd-meta-row">
                <div className="pd-meta-item">
                  <span className="pd-meta-label">Condition</span>
                  <span className={`pd-condition-badge ${condClass[item.condition] || ''}`}>
                    {item.condition}
                  </span>
                </div>
                <div className="pd-meta-item">
                  <span className="pd-meta-label">Listed</span>
                  <span className="pd-meta-value">{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="pd-section">
                <h3 className="pd-section-title">Description</h3>
                <p className="pd-description">{item.description || 'No description provided.'}</p>
              </div>

              <div className="pd-section">
                <h3 className="pd-section-title">Seller Information</h3>
                <div className="pd-seller-card">
                  <div className="pd-seller-avatar">{sellerName.charAt(0).toUpperCase()}</div>
                  <div className="pd-seller-info">
                    <div className="pd-seller-name">{sellerName}</div>
                    <div className="pd-seller-email">{sellerEmail}</div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS — no inline buy form, no modal, no state toggle */}
              {isSold ? (
                <div className="pd-sold-banner">
                  <span className="pd-sold-icon">✅</span>
                  <div>
                    <div className="pd-sold-title">This item has been sold</div>
                    <div className="pd-sold-sub">No longer available</div>
                  </div>
                </div>
              ) : isOwn ? (
                <div className="pd-own-listing">
                  <div className="pd-own-badge">📌 This is your listing</div>
                  <button className="pd-btn-mark-sold" onClick={handleMarkSold}>
                    Mark as Sold
                  </button>
                </div>
              ) : (
                <div className="pd-actions">

                  {/* Buy Item — navigates to /buy/:id as a full separate page */}
                  <button
                    className="pd-btn-buy"
                    onClick={() => navigate(`/buy/${item._id}`)}
                  >
                    🛒 Buy Item
                  </button>

                  <button className="pd-btn-message" onClick={handleMessageSeller}>
                    💬 Message Seller
                  </button>

                  <button className="pd-btn-wishlist" onClick={toggleWishlist}>
                    {inWishlist ? '❤️ In Wishlist' : '🤍 Wishlist'}
                  </button>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
