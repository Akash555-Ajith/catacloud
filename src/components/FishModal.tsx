'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import styles from './FishModal.module.css';

interface FishModalProps {
  fish: FishItem | null;
  onClose: () => void;
  onAddToCart: (fish: FishItem, quantity: number) => void;
}

export default function FishModal({ fish, onClose, onAddToCart }: FishModalProps) {
  const [quantity, setQuantity] = useState<number>(1);

  if (!fish) return null;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAdd = () => {
    onAddToCart(fish, quantity);
    onClose();
  };

  const isPremium = fish.category === 'Premium Import';

  return (
    <div className={styles.backdrop} onClick={onClose} id="fish-modal-backdrop">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className={styles.closeButton} onClick={onClose} aria-label="Close details" id="close-modal-btn">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className={styles.grid}>
          <div className={styles.imageSection}>
            <Image
              src={fish.image}
              alt={fish.name}
              fill
              sizes="(max-width: 768px) 100vw, 450px"
              className={styles.image}
              priority
            />
          </div>

          <div className={styles.infoSection}>
            <span className={styles.category}>{fish.category}</span>
            <h2 className={styles.title}>{fish.name}</h2>
            <p className={styles.scientific}>{fish.scientificName}</p>

            <p className={styles.description}>{fish.description}</p>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Origin</span>
                <span className={styles.detailValue}>{fish.origin}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Sustainability</span>
                <span className={styles.detailValue} style={{ color: 'var(--accent-success)' }}>
                  {fish.sustainability}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Prep Recommendation</span>
                <span className={styles.detailValue}>{fish.prepTime}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Chef Difficulty</span>
                <span className={styles.detailValue}>{fish.difficulty}</span>
              </div>
            </div>

            <div className={styles.profileSection}>
              <h4 className={styles.sectionTitle}>Taste Profile</h4>
              <div className={styles.tags}>
                {fish.tasteProfile.map((taste) => (
                  <span key={taste} className={styles.tag}>
                    {taste}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.profileSection}>
              <h4 className={styles.sectionTitle}>Texture</h4>
              <p className={styles.tag} style={{ display: 'inline-block' }}>
                {fish.texture}
              </p>
            </div>

            <div className={styles.actionRow}>
              <div className={styles.quantitySelector}>
                <button className={styles.qtyBtn} onClick={handleDecrement} aria-label="Decrease quantity">
                  &minus;
                </button>
                <span className={styles.qtyValue}>
                  {quantity}
                  <span className={styles.qtyUnit}>kg</span>
                </span>
                <button className={styles.qtyBtn} onClick={handleIncrement} aria-label="Increase quantity">
                  +
                </button>
              </div>

              <button
                className={isPremium ? 'btn-gold' : 'btn-primary'}
                onClick={handleAdd}
                style={{ flexGrow: 1 }}
                id="add-to-selection-btn"
              >
                Add Selection &bull; ${(fish.pricePerKg * quantity).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
