'use client';

import React, { useState } from 'react';
import { FishItem } from '@/data/fishData';
import styles from './CheckoutModal.module.css';

interface CartItemData {
  fish: FishItem;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemData[];
  onClearCart: () => void;
}

interface FormState {
  fullName: string;
  deliveryDate: string;
  address: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, onClearCart }: CheckoutModalProps) {
  const [step, setStep] = useState<number>(1);
  const [orderRef, setOrderRef] = useState<string>('');
  const [form, setForm] = useState<FormState>({
    fullName: '',
    deliveryDate: '',
    address: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  if (!isOpen) return null;

  const totalWeight = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.fish.pricePerKg * item.quantity, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Mask inputs if needed
    let processedValue = value;
    if (name === 'cardNumber') {
      processedValue = value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim().substring(0, 19);
    } else if (name === 'cardExpiry') {
      processedValue = value.replace(/\/?/g, '').replace(/(\d{2})/g, '$1/').trim().substring(0, 5);
      if (processedValue.endsWith('/')) processedValue = processedValue.slice(0, -1);
    } else if (name === 'cardCvv') {
      processedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setForm((prev) => ({ ...prev, [name]: processedValue }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep1 = () => {
    const nextErrors: Partial<FormState> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Recipient name is required';
    if (!form.deliveryDate) nextErrors.deliveryDate = 'Delivery date is required';
    if (!form.address.trim()) nextErrors.address = 'Port of delivery (address) is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateStep2 = () => {
    const nextErrors: Partial<FormState> = {};
    const sanitizedCard = form.cardNumber.replace(/\s/g, '');
    if (sanitizedCard.length < 15) nextErrors.cardNumber = 'Invalid license/card number';
    if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry)) nextErrors.cardExpiry = 'Format MM/YY required';
    if (form.cardCvv.length < 3) nextErrors.cardCvv = 'Security code invalid';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setOrderRef(`BF-${Math.floor(100000 + Math.random() * 900000)}`);
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleDone = () => {
    onClearCart();
    onClose();
    setStep(1);
    setOrderRef('');
    setForm({
      fullName: '',
      deliveryDate: '',
      address: '',
      cardNumber: '',
      cardExpiry: '',
      cardCvv: ''
    });
  };

  const formatCardDisplay = (num: string) => {
    if (!num) return '•••• •••• •••• ••••';
    const cleanNum = num.replace(/\s/g, '');
    let display = '';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) display += ' ';
      display += cleanNum[i] || '•';
    }
    return display;
  };

  return (
    <div className={styles.backdrop} onClick={step === 3 ? undefined : onClose} id="checkout-modal-backdrop">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {step !== 3 && (
          <button className={styles.closeButton} onClick={onClose} aria-label="Close checkout" id="close-checkout-btn">
            <svg
              width="18"
              height="18"
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
        )}

        <h2 className={styles.title}>
          {step === 3 ? 'Reservation Succeeded' : 'Secure Seafood Reservation'}
        </h2>

        {/* Step Indicators */}
        <div className={styles.stepIndicator}>
          <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
          <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineActive : ''}`} />
          <div className={`${styles.stepDot} ${step >= 2 ? styles.stepDotActive : ''}`} />
          <div className={`${styles.stepLine} ${step === 3 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.stepDot} ${step === 3 ? styles.stepDotActive : ''}`} />
        </div>

        {step === 1 && (
          <form onSubmit={handleNext} id="checkout-step-1">
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="fullName">
                Recipient Name / Chef Licensee
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleInputChange}
                className="luxury-input"
                placeholder="e.g. Chef Mitsuhiro Araki"
                required
              />
              {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="deliveryDate">
                Preferred Sourcing & Delivery Date
              </label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={handleInputChange}
                className="luxury-input"
                required
              />
              {errors.deliveryDate && <span className={styles.errorText}>{errors.deliveryDate}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="address">
                Port of Delivery / Delivery Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                className="luxury-input"
                placeholder="e.g. 12 Tsukiji St, Kitchen 4B, Tokyo"
                required
              />
              {errors.address && <span className={styles.errorText}>{errors.address}</span>}
            </div>

            <div className={styles.actions}>
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" id="checkout-next-btn">
                Logistics &bull; Next
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext} id="checkout-step-2">
            {/* Credit Card Visualization */}
            <div className={styles.cardMockup}>
              <div className={styles.cardChip} />
              <div className={styles.cardNumber}>{formatCardDisplay(form.cardNumber)}</div>
              <div className={styles.cardFooter}>
                <div>
                  <div className={styles.cardLabel}>Cardholder</div>
                  <div className={styles.cardValue}>{form.fullName || 'YOUR NAME'}</div>
                </div>
                <div>
                  <div className={styles.cardLabel}>Expires</div>
                  <div className={styles.cardValue}>{form.cardExpiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="cardNumber">
                Sourcing License Card Number
              </label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={form.cardNumber}
                onChange={handleInputChange}
                className="luxury-input"
                placeholder="4111 2222 3333 4444"
                maxLength={19}
                required
              />
              {errors.cardNumber && <span className={styles.errorText}>{errors.cardNumber}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="cardExpiry">
                  Expiry (MM/YY)
                </label>
                <input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  value={form.cardExpiry}
                  onChange={handleInputChange}
                  className="luxury-input"
                  placeholder="09/27"
                  maxLength={5}
                  required
                />
                {errors.cardExpiry && <span className={styles.errorText}>{errors.cardExpiry}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="cardCvv">
                  Security Code (CVV)
                </label>
                <input
                  type="password"
                  id="cardCvv"
                  name="cardCvv"
                  value={form.cardCvv}
                  onChange={handleInputChange}
                  className="luxury-input"
                  placeholder="•••"
                  maxLength={4}
                  required
                />
                {errors.cardCvv && <span className={styles.errorText}>{errors.cardCvv}</span>}
              </div>
            </div>

            <div className={styles.actions}>
              <button type="button" className="btn-secondary" onClick={handleBack}>
                Back
              </button>
              <button type="submit" className="btn-primary" id="checkout-submit-btn">
                Reserve Catch &bull; ${totalPrice.toFixed(2)}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className={styles.successContainer} id="checkout-step-3-success">
            <svg
              className={styles.successIcon}
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3 className={styles.successTitle}>Catch Reserved!</h3>
            <p className={styles.successText}>
              Our divers and sourcing crew have been notified. A fresh shipment of cold-water marine delicacies will be dispatched to your port.
            </p>

            <div className={styles.receiptCard}>
              <div className={styles.receiptRow}>
                <span>Order Reference:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {orderRef}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span>Vessel Logistics Port:</span>
                <span style={{ color: 'var(--text-primary)' }}>{form.address}</span>
              </div>
              <div className={styles.receiptRow}>
                <span>Estimated Arrival:</span>
                <span style={{ color: 'var(--text-primary)' }}>{form.deliveryDate}</span>
              </div>
              <div className={styles.receiptRow}>
                <span>Sourced Variety Weight:</span>
                <span style={{ color: 'var(--text-primary)' }}>{totalWeight} kg</span>
              </div>
              <div className={styles.receiptTotal}>
                <span>Amount Paid:</span>
                <span style={{ color: 'var(--accent-cyan)' }}>${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <button className="btn-gold" onClick={handleDone} style={{ width: '100%' }} id="success-done-btn">
              Return to Port / Catalog
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
