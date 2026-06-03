'use client';

import React, { useEffect, useState } from 'react';
import styles from './Navbar.module.css';

interface NavbarProps {
  cartCount: number;
  onCartToggle: () => void;
  onLogout: () => void;
}

export default function Navbar({ cartCount, onCartToggle, onLogout }: NavbarProps) {
  const [userName, setUserName] = useState<string>('Guest');

  useEffect(() => {
    const user = localStorage.getItem('bluefine_user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setTimeout(() => {
          if (parsed && parsed.name) {
            setUserName(parsed.name);
          } else if (parsed && parsed.email) {
            setUserName(parsed.email.split('@')[0]);
          }
        }, 0);
      } catch {
        setTimeout(() => {
          setUserName(user);
        }, 0);
      }
    }
  }, []);

  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.brand}>
        {/* Luxury Fish/Wave SVG logo */}
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))' }}
        >
          <path
            d="M28 16C28 22.6274 22.6274 28 16 28C11.5 28 7.5 25.5 5 21.5C8 21.5 11.5 19.5 13.5 17C15.5 14.5 16 11.5 17.5 9.5C19 7.5 21.5 6 24 6C26 6 28 7 28 9C28 11 25.5 12.5 24 13.5C22.5 14.5 20.5 15.5 20.5 16.5C20.5 17.5 22 18.5 23.5 19C25 19.5 28 19 28 16Z"
            fill="url(#logo-grad)"
          />
          <path
            d="M4 16C4 9.37258 9.37258 4 16 4C19 4 21.5 5 22.5 6.5C19 7 16 9 14.5 11C13 13 12 15 10 16.5C8 18 6 18.5 4.5 18C4 17.5 4 17 4 16Z"
            fill="url(#logo-grad-accent)"
            opacity="0.7"
          />
          <defs>
            <linearGradient id="logo-grad" x1="5" y1="6" x2="28" y2="28" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f2fe" />
              <stop offset="1" stopColor="#4facfe" />
            </linearGradient>
            <linearGradient id="logo-grad-accent" x1="4" y1="4" x2="22.5" y2="18" gradientUnits="userSpaceOnUse">
              <stop stopColor="#e2b744" />
              <stop offset="1" stopColor="#b88e1a" />
            </linearGradient>
          </defs>
        </svg>
        <span className={styles.logoText}>Bluefine</span>
      </div>

      <nav>
        <ul className={styles.navLinks}>
          <li>
            <span className={`${styles.navLink} ${styles.navLinkActive}`}>Catalogue</span>
          </li>
          <li>
            <span className={styles.navLink}>Sustainability</span>
          </li>
          <li>
            <span className={styles.navLink}>Direct Source</span>
          </li>
          <li>
            <span className={styles.navLink}>Chef Portal</span>
          </li>
        </ul>
      </nav>

      <div className={styles.actions}>
        <button
          className={styles.cartButton}
          onClick={onCartToggle}
          aria-label="Toggle Shopping Cart"
          id="cart-toggle-btn"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartCount > 0 && (
            <span className={styles.cartBadge} id="cart-badge-count">
              {cartCount}
            </span>
          )}
        </button>

        <div className={styles.userMenu}>
          <div className={styles.avatar}>{getInitials(userName)}</div>
          <span className={styles.userName}>{userName}</span>
          <button className={styles.logoutBtn} onClick={onLogout} id="logout-button">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
