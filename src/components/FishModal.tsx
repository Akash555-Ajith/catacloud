'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <Dialog open={!!fish} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="sm:max-w-[850px] w-full border border-[var(--glass-border)] bg-[rgba(7,16,32,0.95)] backdrop-blur-2xl text-[var(--text-primary)] p-0 overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
        showCloseButton={true}
      >
        {/* Visually hidden but accessible DialogTitle for accessibility compliance */}
        <DialogTitle className="sr-only">{fish.name}</DialogTitle>

        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.2fr] h-full">
          <div className="relative min-h-[300px] md:min-h-full w-full aspect-square md:aspect-auto">
            <Image
              src={fish.image}
              alt={fish.name}
              fill
              sizes="(max-width: 768px) 100vw, 450px"
              className="object-cover"
              priority
            />
          </div>

          <div className="flex flex-col p-6 md:p-8 max-h-[85vh] overflow-y-auto">
            <div className="mb-4">
              <Badge 
                variant="outline" 
                className="mb-2 border-[var(--glass-border)] text-[var(--accent-cyan)] bg-[rgba(0,242,254,0.02)] uppercase tracking-wider text-[9px] font-bold"
              >
                {fish.category}
              </Badge>
              <h2 className="font-heading text-2xl md:text-3xl font-bold leading-tight mb-1">{fish.name}</h2>
              <p className="text-xs italic text-[var(--text-secondary)]">{fish.scientificName}</p>
            </div>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
              {fish.description}
            </p>

            <div className="grid grid-cols-2 gap-4 border-y border-[rgba(255,255,255,0.06)] py-4 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-0.5">Origin</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{fish.origin}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-0.5">Sustainability</span>
                <span className="text-sm font-semibold text-[var(--accent-success)]">{fish.sustainability}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-0.5">Prep Recommendation</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{fish.prepTime}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-0.5">Chef Difficulty</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{fish.difficulty}</span>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--text-secondary)] mb-2">Taste Profile</h4>
              <div className="flex flex-wrap gap-2">
                {fish.tasteProfile.map((taste) => (
                  <Badge 
                    key={taste} 
                    className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] px-2.5 py-0.5 font-medium rounded-md text-xs"
                    variant="outline"
                  >
                    {taste}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--text-secondary)] mb-2">Texture</h4>
              <Badge 
                className="bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[var(--text-secondary)] px-2.5 py-0.5 font-medium rounded-md text-xs"
                variant="outline"
              >
                {fish.texture}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-auto pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center border border-[var(--glass-border)] rounded-lg bg-[rgba(5,12,26,0.6)] h-11 px-2">
                <button 
                  className="w-8 h-8 flex items-center justify-center text-lg text-[var(--text-secondary)] hover:text-white cursor-pointer transition-colors" 
                  onClick={handleDecrement} 
                  aria-label="Decrease quantity"
                >
                  &minus;
                </button>
                <span className="min-w-[60px] text-center font-bold text-sm text-[var(--text-primary)]">
                  {quantity} <span className="text-xs text-[var(--text-secondary)] font-normal">kg</span>
                </span>
                <button 
                  className="w-8 h-8 flex items-center justify-center text-lg text-[var(--text-secondary)] hover:text-white cursor-pointer transition-colors" 
                  onClick={handleIncrement} 
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <Button
                onClick={handleAdd}
                className={`flex-1 h-11 text-sm font-semibold rounded-lg shadow-md transition-all duration-200 ${
                  isPremium 
                    ? 'bg-gradient-to-r from-[#e2b744] to-[#b88e1a] text-[#030812] hover:brightness-110' 
                    : 'bg-gradient-to-r from-[var(--accent-cyan)] to-[var(--accent-blue)] text-[#030812] hover:brightness-110'
                }`}
                id="add-to-selection-btn"
              >
                Add Selection &bull; ${(fish.pricePerKg * quantity).toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
