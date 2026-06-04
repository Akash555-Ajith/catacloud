'use client';

import React from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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
  const totalWeight = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cartItems.reduce((acc, item) => acc + item.fish.pricePerKg * item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent 
        side="right"
        className="w-full sm:max-w-md border-l border-[var(--glass-border)] bg-[rgba(7,16,32,0.95)] backdrop-blur-2xl text-[var(--text-primary)] p-0 flex flex-col h-full shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        showCloseButton={true}
      >
        <SheetHeader className="p-5 border-b border-[rgba(255,255,255,0.06)] flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <SheetTitle className="font-heading text-lg font-bold text-[var(--text-primary)]">Your Selection</SheetTitle>
            {cartItems.length > 0 && (
              <span className="text-[10px] uppercase font-bold text-[var(--accent-cyan)] bg-[rgba(0,242,254,0.08)] border border-[rgba(0,242,254,0.15)] px-2 py-0.5 rounded-full" id="cart-item-count-label">
                {cartItems.length} {cartItems.length === 1 ? 'variety' : 'varieties'}
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--text-muted)] mb-4"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">The Hold is Empty</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs leading-relaxed">
                Explore our fine catalogue to select premium cuts of fish.
              </p>
              <Button
                className="mt-6 h-10 px-6 rounded-lg bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-[#030812] font-semibold text-xs transition-all duration-200"
                onClick={onClose}
              >
                Discover Seafood
              </Button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.fish.id} className="flex gap-4 p-4 border border-[var(--glass-border)] bg-[rgba(255,255,255,0.01)] rounded-xl">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={item.fish.image}
                    alt={item.fish.name}
                    fill
                    sizes="70px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{item.fish.name}</h4>
                      <p className="text-[10px] italic text-[var(--text-secondary)] mt-0.5">{item.fish.scientificName}</p>
                    </div>
                    <button
                      className="text-[var(--text-muted)] hover:text-[var(--accent-danger)] transition-colors cursor-pointer p-1"
                      onClick={() => onRemoveItem(item.fish.id)}
                      aria-label={`Remove ${item.fish.name} from selection`}
                      id={`remove-btn-${item.fish.id}`}
                    >
                      <svg
                        width="15"
                        height="15"
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

                  <div className="flex justify-between items-end mt-2">
                    <div className="flex items-center border border-[var(--glass-border)] rounded-md bg-[rgba(5,12,26,0.6)] h-8 px-1.5">
                      <button
                        className="w-5 h-5 flex items-center justify-center text-sm text-[var(--text-secondary)] hover:text-white cursor-pointer"
                        onClick={() => onUpdateQuantity(item.fish.id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        &minus;
                      </button>
                      <span className="min-w-[32px] text-center text-xs font-bold">{item.quantity}kg</span>
                      <button
                        className="w-5 h-5 flex items-center justify-center text-sm text-[var(--text-secondary)] hover:text-white cursor-pointer"
                        onClick={() => onUpdateQuantity(item.fish.id, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        ${(item.fish.pricePerKg * item.quantity).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)]">
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
          <div className="p-5 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(5,12,26,0.4)] space-y-3">
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Total Sourced Weight:</span>
              <span className="font-semibold text-[var(--text-primary)]">{totalWeight} kg</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-secondary)]">
              <span>Logistics & Handling:</span>
              <span className="text-[var(--accent-success)] font-semibold">Complimentary</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-sm font-medium">Estimated Total:</span>
              <span className="text-xl font-bold text-[var(--accent-cyan)]" style={{ textShadow: '0 0 10px rgba(0,242,254,0.2)' }}>
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <Button
              className="w-full h-11 bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-[#030812] font-bold text-sm rounded-lg hover:brightness-110 shadow-md transition-all duration-200 mt-2"
              onClick={onCheckout}
              id="proceed-checkout-btn"
            >
              Proceed to Reserve Catch
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
