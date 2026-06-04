'use client';

import React, { useState } from 'react';
import { FishItem } from '@/data/fishData';
import { addOrder, Order } from '@/utils/store';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface CartItemData {
  fish: FishItem;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItemData[];
  onClearCart: () => void;
  unit?: string;
}

interface FormState {
  fullName: string;
  deliveryDate: string;
  address: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, onClearCart, unit }: CheckoutModalProps) {
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
      const newOrderRef = `BF-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderRef(newOrderRef);
      
      let userEmail = 'chef@example.com';
      let userName = 'Chef Guest';
      if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('bluefine_user');
        if (userStr) {
          try {
            const parsed = JSON.parse(userStr);
            if (parsed.email) userEmail = parsed.email;
            if (parsed.name) userName = parsed.name;
          } catch {}
        }
      }

      const newOrder: Order = {
        id: newOrderRef,
        userEmail,
        userName,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        deliveryDate: form.deliveryDate,
        address: form.address,
        items: cartItems.map((item) => ({
          fishId: item.fish.id,
          name: item.fish.name,
          quantity: item.quantity,
          price: item.fish.pricePerKg,
          image: item.fish.image
        })),
        totalPrice,
        status: 'Pending'
      };

      addOrder(newOrder);
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && step !== 3) onClose(); }}>
      <DialogContent 
        className="sm:max-w-lg w-full border border-[var(--glass-border)] bg-[rgba(7,16,32,0.95)] backdrop-blur-2xl text-[var(--text-primary)] p-6 md:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        showCloseButton={step !== 3}
      >
        <DialogTitle className="font-heading text-xl md:text-2xl font-bold leading-tight mb-2">
          {step === 3 ? 'Reservation Succeeded' : 'Secure Seafood Reservation'}
        </DialogTitle>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-2 w-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_8px_var(--accent-cyan)]" />
          <div className={`h-[2px] w-12 rounded transition-colors ${step >= 2 ? 'bg-[var(--accent-cyan)]' : 'bg-[rgba(255,255,255,0.08)]'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${step >= 2 ? 'bg-[var(--accent-cyan)] shadow-[0_0_8px_var(--accent-cyan)]' : 'bg-[rgba(255,255,255,0.15)]'}`} />
          <div className={`h-[2px] w-12 rounded transition-colors ${step === 3 ? 'bg-[var(--accent-cyan)]' : 'bg-[rgba(255,255,255,0.08)]'}`} />
          <div className={`h-2 w-2 rounded-full transition-all ${step === 3 ? 'bg-[var(--accent-cyan)] shadow-[0_0_8px_var(--accent-cyan)]' : 'bg-[rgba(255,255,255,0.15)]'}`} />
        </div>

        {step === 1 && (
          <form onSubmit={handleNext} id="checkout-step-1" className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Recipient Name / Chef Licensee
              </Label>
              <Input
                type="text"
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleInputChange}
                className="luxury-input h-11 bg-[rgba(5,12,26,0.6)]"
                placeholder="e.g. Chef Mitsuhiro Araki"
                required
              />
              {errors.fullName && <span className="text-[11px] text-[var(--accent-danger)] font-semibold mt-0.5">{errors.fullName}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveryDate" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Preferred Sourcing & Delivery Date
              </Label>
              <Input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={handleInputChange}
                className="luxury-input h-11 bg-[rgba(5,12,26,0.6)]"
                required
              />
              {errors.deliveryDate && <span className="text-[11px] text-[var(--accent-danger)] font-semibold mt-0.5">{errors.deliveryDate}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Port of Delivery / Delivery Address
              </Label>
              <Input
                type="text"
                id="address"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                className="luxury-input h-11 bg-[rgba(5,12,26,0.6)]"
                placeholder="e.g. 12 Tsukiji St, Kitchen 4B, Tokyo"
                required
              />
              {errors.address && <span className="text-[11px] text-[var(--accent-danger)] font-semibold mt-0.5">{errors.address}</span>}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <Button type="button" variant="outline" className="h-11 px-6 font-semibold" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-[#030812] hover:brightness-110" id="checkout-next-btn">
                Logistics &bull; Next
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleNext} id="checkout-step-2" className="space-y-4">
            {/* Credit Card Visualization */}
            <div className="relative w-full aspect-[1.8/1] rounded-2xl bg-gradient-to-br from-[var(--bg-accent)] to-[var(--bg-secondary)] border border-[rgba(255,255,255,0.07)] p-6 flex flex-col justify-between shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,rgba(0,242,254,0.06)_0%,transparent_70%)] pointer-events-none" />
              <div className="h-8 w-11 bg-gradient-to-r from-[var(--accent-gold)] to-[#b88e1a] opacity-80 rounded-md" />
              <div className="font-heading text-lg md:text-xl font-bold tracking-widest text-[var(--text-primary)] text-center my-4">
                {formatCardDisplay(form.cardNumber)}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">Cardholder</div>
                  <div className="text-xs font-bold uppercase mt-0.5">{form.fullName || 'YOUR NAME'}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">Expires</div>
                  <div className="text-xs font-bold mt-0.5">{form.cardExpiry || 'MM/YY'}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cardNumber" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Sourcing License Card Number
              </Label>
              <Input
                type="text"
                id="cardNumber"
                name="cardNumber"
                value={form.cardNumber}
                onChange={handleInputChange}
                className="luxury-input h-11 bg-[rgba(5,12,26,0.6)]"
                placeholder="4111 2222 3333 4444"
                maxLength={19}
                required
              />
              {errors.cardNumber && <span className="text-[11px] text-[var(--accent-danger)] font-semibold mt-0.5">{errors.cardNumber}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="cardExpiry" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Expiry (MM/YY)
                </Label>
                <Input
                  type="text"
                  id="cardExpiry"
                  name="cardExpiry"
                  value={form.cardExpiry}
                  onChange={handleInputChange}
                  className="luxury-input h-11 bg-[rgba(5,12,26,0.6)]"
                  placeholder="09/27"
                  maxLength={5}
                  required
                />
                {errors.cardExpiry && <span className="text-[11px] text-[var(--accent-danger)] font-semibold mt-0.5">{errors.cardExpiry}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cardCvv" className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Security Code (CVV)
                </Label>
                <Input
                  type="password"
                  id="cardCvv"
                  name="cardCvv"
                  value={form.cardCvv}
                  onChange={handleInputChange}
                  className="luxury-input h-11 bg-[rgba(5,12,26,0.6)]"
                  placeholder="•••"
                  maxLength={4}
                  required
                />
                {errors.cardCvv && <span className="text-[11px] text-[var(--accent-danger)] font-semibold mt-0.5">{errors.cardCvv}</span>}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <Button type="button" variant="outline" className="h-11 px-6 font-semibold" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit" className="h-11 px-6 font-bold bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-[#030812] hover:brightness-110" id="checkout-submit-btn">
                Reserve Catch &bull; ${totalPrice.toFixed(2)}
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center text-center py-4 space-y-4" id="checkout-step-3-success">
            <svg
              className="text-[var(--accent-success)] w-16 h-16 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]"
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
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Catch Reserved!</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm">
              Our divers and sourcing crew have been notified. A fresh shipment of cold-water marine delicacies will be dispatched to your port.
            </p>

            <div className="w-full rounded-xl border border-[var(--glass-border)] bg-[rgba(255,255,255,0.01)] p-5 text-left text-xs space-y-2.5 my-4">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Order Reference:</span>
                <span className="font-bold text-[var(--text-primary)]">{orderRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Vessel Logistics Port:</span>
                <span className="font-semibold text-[var(--text-primary)]">{form.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Estimated Arrival:</span>
                <span className="font-semibold text-[var(--text-primary)]">{form.deliveryDate}</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Total Quantity:</span>
                <span className="font-semibold text-[var(--text-primary)]">{totalWeight} {unit || 'units'}</span>
              </div>
              <div className="flex justify-between pt-2.5 border-t border-[rgba(255,255,255,0.06)] text-sm">
                <span className="font-medium text-[var(--text-primary)]">Amount Paid:</span>
                <span className="font-bold text-[var(--accent-cyan)]">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-11 bg-gradient-to-r from-[#e2b744] to-[#b88e1a] text-[#030812] font-bold text-sm rounded-lg hover:brightness-110 shadow-md transition-all duration-200 mt-2" 
              onClick={handleDone} 
              id="success-done-btn"
            >
              Return to Port / Catalog
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
