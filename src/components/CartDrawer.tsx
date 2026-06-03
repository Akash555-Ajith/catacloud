'use client';

import React from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import styles from './CartDrawer.module.css';

interface CartItemData {
  fish: FishItem;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemData[];
  onUpdateQuantity: (fishId: string, quantity: number) => void;
  onRemoveItem: (fishId: string) => void;
  onCheckout: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  if (!isOpen) return null;

  const totalWeight = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.fish.pricePerKg * item.quantity, 0);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} id="cart-drawer-overlay" />
      <div className={styles.drawer} role="dialog" aria-modal="true" id="cart-drawer-container">
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 className={styles.title}>Your Selection</h2>
            {cartItems.length > 0 && (
              <span className={styles.itemCount} id="cart-item-count-label">
                {cartItems.length} {cartItems.length === 1 ? 'variety' : 'varieties'}
              </span>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close cart" id="close-cart-btn">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {cartItems.length === 0 ? (
            <div className={styles.emptyState}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.emptyIcon}
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <h3 className={styles.emptyTitle}>The Hold is Empty</h3>
              <p className={styles.emptyText}>
                Explore our fine catalogue to select premium cuts of fish.
              </p>
              <button
                className="btn-primary"
                style={{ marginTop: '24px' }}
                onClick={onClose}
              >
                Discover Seafood
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.fish.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <Image
                    src={item.fish.image}
                    alt={item.fish.name}
                    fill
                    sizes="70px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.itemDetails}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 className={styles.itemName}>{item.fish.name}</h4>
                      <p className={styles.itemScientific}>{item.fish.scientificName}</p>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => onRemoveItem(item.fish.id)}
                      aria-label={`Remove ${item.fish.name} from selection`}
                      id={`remove-btn-${item.fish.id}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

                  <div className={styles.itemMeta}>
                    <div className={styles.qtyControl}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => onUpdateQuantity(item.fish.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        &minus;
                      </button>
                      <span className={styles.qtyValue}>{item.quantity}kg</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => onUpdateQuantity(item.fish.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className={styles.itemPrice}>
                        ${(item.fish.pricePerKg * item.quantity).toFixed(2)}
                      </div>
                      <span className={styles.itemPricePerKg}>
                        ${item.fish.pricePerKg.toFixed(2)}/kg
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.summaryRow}>
              <span>Total Sourced Weight:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {totalWeight} kg
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span>Logistics & Handling:</span>
              <span style={{ color: 'var(--accent-success)' }}>Complimentary</span>
            </div>
            <div className={styles.totalRow}>
              <span>Estimated Total:</span>
              <span style={{ color: 'var(--accent-cyan)', textShadow: '0 0 10px rgba(0,242,254,0.2)' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <button
              className="btn-primary checkoutBtn"
              onClick={onCheckout}
              id="proceed-checkout-btn"
            >
              Proceed to Reserve Catch
            </button>
          </div>
        )}
      </div>
    </>
  );
}
