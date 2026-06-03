import React from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import styles from './FishCard.module.css';

interface FishCardProps {
  fish: FishItem;
  onClick: () => void;
}

export default function FishCard({ fish, onClick }: FishCardProps) {
  const isPremium = fish.category === 'Premium Import';

  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageWrapper}>
        <Image
          src={fish.image}
          alt={fish.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
          priority={fish.id === 'bluefin-tuna'}
        />
        <div className={styles.badgeContainer}>
          <span className={`${styles.badge} ${styles.categoryBadge}`}>
            {fish.category}
          </span>
          {isPremium ? (
            <span className={`${styles.badge} ${styles.premiumBadge}`}>
              Rare
            </span>
          ) : (
            <span className={`${styles.badge} ${styles.sustainBadge}`}>
              {fish.sustainability === 'MSC Certified' ? 'MSC' : 'Wild'}
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <span className={styles.scientific}>{fish.scientificName}</span>
        <h3 className={styles.title}>{fish.name}</h3>

        <div className={styles.origin}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={styles.originIcon}
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{fish.origin}</span>
        </div>

        <div className={styles.footer}>
          <div className={styles.priceSection}>
            <span className={styles.priceLabel}>Price</span>
            <span className={styles.price}>
              ${fish.pricePerKg.toFixed(2)}
              <span className={styles.priceUnit}> / kg</span>
            </span>
          </div>

          <button
            className={styles.selectButton}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            id={`select-btn-${fish.id}`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
