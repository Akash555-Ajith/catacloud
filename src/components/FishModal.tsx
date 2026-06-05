import React, { useState } from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StoreConfig, SEAFOOD_PRESET } from '@/data/storeConfig';

interface FishModalProps {
  fish: FishItem | null;
  onClose: () => void;
  onAddToCart: (fish: FishItem, quantity: number) => void;
  storeConfig?: StoreConfig;
}

export default function FishModal({ fish, onClose, onAddToCart, storeConfig }: FishModalProps) {
  const [quantity, setQuantity] = useState<number>(1);

  if (!fish) return null;

  const config = storeConfig || SEAFOOD_PRESET;
  const itemUnit = fish.unit || config.unit;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAdd = () => {
    onAddToCart(fish, quantity);
    onClose();
  };

  const isPremium = fish.category === 'Premium Import' || fish.category === 'Jumbo Specials';

  return (
    <Dialog open={!!fish} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="sm:max-w-[900px] w-[95vw] border border-[var(--glass-border)] bg-[rgba(5,12,26,0.98)] backdrop-blur-3xl text-[var(--text-primary)] p-0 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl"
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">{fish.name}</DialogTitle>
 
        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
          {/* Left Panel: Image Showcase */}
          <div className="relative w-full md:w-[45%] min-h-[280px] md:min-h-full bg-[rgba(0,0,0,0.2)] flex items-center justify-center p-6 md:p-8 border-b md:border-b-0 md:border-r border-[rgba(255,255,255,0.06)]">
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(5,12,26,0.8)] to-transparent pointer-events-none z-10" />
            <div className="relative w-full aspect-square max-w-[320px] rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[rgba(255,255,255,0.05)]">
              <Image
                src={fish.image}
                alt={fish.name}
                fill
                sizes="(max-width: 768px) 320px, 450px"
                className="object-cover transition-transform duration-500 hover:scale-105"
                priority
              />
            </div>
          </div>
 
          {/* Right Panel: Content Details */}
          <div className="flex-1 flex flex-col p-6 md:p-8 md:pl-8 max-h-[85vh] overflow-y-auto justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <Badge 
                  variant="outline" 
                  className="border-[rgba(0,242,254,0.3)] text-[var(--accent-cyan)] bg-[rgba(0,242,254,0.05)] uppercase tracking-widest text-[9px] font-extrabold px-2.5 py-0.5 rounded-full"
                >
                  {fish.category}
                </Badge>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold leading-tight text-[var(--text-primary)] mb-1 pr-6" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {fish.name}
              </h2>
              <p className="text-xs italic text-[var(--text-secondary)] mb-4 font-mono opacity-80">{fish.scientificName}</p>
 
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-medium bg-[rgba(255,255,255,0.01)] border border-[rgba(255,255,255,0.02)] p-4 rounded-xl">
                {fish.description}
              </p>
 
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-[rgba(255,255,255,0.06)] py-5 mb-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1 tracking-wider">Origin</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                    📍 {fish.origin}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1 tracking-wider">{config.attributes.sustainabilityLabel}</span>
                  <span className="text-sm font-semibold text-[var(--accent-success)] flex items-center gap-1.5">
                    🌿 {fish.sustainability}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1 tracking-wider">
                    {config.storeType === 'seafood' ? 'Prep Recommendation' : 'Handling / Storage'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">📦 {fish.prepTime}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1 tracking-wider">
                    {config.storeType === 'seafood' ? 'Chef Difficulty' : 'Care Level'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">⚡ {fish.difficulty}</span>
                </div>
              </div>
 
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--text-secondary)] mb-2">{config.attributes.tasteProfileLabel}</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {fish.tasteProfile.map((taste) => (
                      <Badge 
                        key={taste} 
                        className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] text-[var(--text-secondary)] px-2.5 py-0.5 font-semibold rounded-md text-[11px]"
                        variant="outline"
                      >
                        {taste}
                      </Badge>
                    ))}
                  </div>
                </div>
 
                <div className="flex-1">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-[var(--text-secondary)] mb-2">{config.attributes.textureLabel}</h4>
                  <Badge 
                    className="bg-[rgba(0,242,254,0.02)] border border-[rgba(0,242,254,0.1)] text-[var(--accent-cyan)] px-2.5 py-0.5 font-semibold rounded-md text-[11px]"
                    variant="outline"
                  >
                    {fish.texture}
                  </Badge>
                </div>
              </div>
            </div>
 
            <div className="flex items-center gap-4 mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center border border-[var(--glass-border)] rounded-lg bg-[rgba(5,12,26,0.6)] h-11 px-2">
                <button 
                  className="w-8 h-8 flex items-center justify-center text-lg text-[var(--text-secondary)] hover:text-white cursor-pointer transition-colors" 
                  onClick={handleDecrement} 
                  aria-label="Decrease quantity"
                >
                  &minus;
                </button>
                <span className="min-w-[65px] text-center font-bold text-sm text-[var(--text-primary)]">
                  {quantity} <span className="text-xs text-[var(--text-secondary)] font-normal">{itemUnit}</span>
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
                className={`flex-1 h-11 text-sm font-bold rounded-lg shadow-md transition-all duration-200 ${
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
