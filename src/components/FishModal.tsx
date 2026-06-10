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
  const isClothing = config.storeType === 'clothing';

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleAdd = () => {
    onAddToCart(fish, quantity);
    onClose();
  };

  const isPremium = fish.category === 'Premium Import' || fish.category === 'Jumbo Specials';

  // Clothing theme colours
  const accent = isClothing ? '#d4a96a' : 'var(--accent-cyan)';
  const accentRgba = isClothing ? 'rgba(212,169,106,' : 'rgba(0,242,254,';
  const bgModal = isClothing ? 'rgba(12,10,8,0.99)' : 'rgba(5,12,26,0.98)';
  const borderColor = isClothing ? 'rgba(180,140,100,0.18)' : 'var(--glass-border)';

  return (
    <Dialog open={!!fish} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-[900px] w-[95vw] backdrop-blur-3xl text-[var(--text-primary)] p-0 overflow-hidden rounded-2xl"
        style={{
          background: bgModal,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
        }}
        showCloseButton={true}
      >
        <DialogTitle className="sr-only">{fish.name}</DialogTitle>

        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
          {/* Left Panel: Image Showcase */}
          <div
            className="relative w-full md:w-[45%] min-h-[280px] md:min-h-full flex items-center justify-center p-6 md:p-8"
            style={{
              background: 'rgba(0,0,0,0.25)',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              borderRight: 'none',
            }}
          >
            <div className="absolute inset-0 pointer-events-none z-10"
              style={{ background: isClothing
                ? 'linear-gradient(to top, rgba(12,10,8,0.85) 0%, transparent 50%)'
                : 'linear-gradient(to top, rgba(5,12,26,0.8) 0%, transparent 50%)' }} />
            <div
              className="relative w-full aspect-square max-w-[320px] rounded-xl overflow-hidden"
              style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: `1px solid ${isClothing ? 'rgba(180,140,100,0.12)' : 'rgba(255,255,255,0.05)'}` }}
            >
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
                  style={{
                    borderColor: `${accentRgba}0.3)`,
                    color: accent,
                    background: `${accentRgba}0.06)`,
                  }}
                  className="uppercase tracking-widest text-[9px] font-extrabold px-2.5 py-0.5 rounded-full"
                >
                  {fish.category}
                </Badge>
              </div>
              <h2 className="font-heading text-2xl md:text-3xl font-extrabold leading-tight text-[var(--text-primary)] mb-1 pr-6" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                {fish.name}
              </h2>
              <p className="text-xs italic text-[var(--text-secondary)] mb-4 font-mono opacity-80">{fish.scientificName}</p>

              <p
                className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-medium p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}
              >
                {fish.description}
              </p>

              <div
                className="grid grid-cols-2 gap-x-6 gap-y-4 py-5 mb-6"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1 tracking-wider">
                    {isClothing ? 'Made In' : 'Origin'}
                  </span>
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
                    {config.storeType === 'seafood' ? 'Prep Recommendation' : config.storeType === 'clothing' ? 'Care Instructions' : 'Handling / Storage'}
                  </span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">📦 {fish.prepTime}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block mb-1 tracking-wider">
                    {config.storeType === 'seafood' ? 'Chef Difficulty' : config.storeType === 'clothing' ? 'Care Level' : 'Care Level'}
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
                        className="px-2.5 py-0.5 font-semibold rounded-md text-[11px]"
                        style={{
                          background: `${accentRgba}0.04)`,
                          border: `1px solid ${accentRgba}0.14)`,
                          color: 'var(--text-secondary)',
                        }}
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
                    className="px-2.5 py-0.5 font-semibold rounded-md text-[11px]"
                    style={{
                      background: `${accentRgba}0.05)`,
                      border: `1px solid ${accentRgba}0.18)`,
                      color: accent,
                    }}
                    variant="outline"
                  >
                    {fish.texture}
                  </Badge>
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-4 mt-6 pt-5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="flex items-center rounded-lg h-11 px-2"
                style={{
                  border: `1px solid ${borderColor}`,
                  background: isClothing ? 'rgba(14,12,10,0.7)' : 'rgba(5,12,26,0.6)',
                }}
              >
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

              <button
                onClick={handleAdd}
                id="add-to-selection-btn"
                className="flex-1 h-11 text-sm font-bold rounded-lg shadow-md transition-all duration-200 hover:brightness-110 cursor-pointer border-none"
                style={{
                  background: isClothing
                    ? 'linear-gradient(135deg, #d4a96a 0%, #e8c47a 55%, #c08040 100%)'
                    : isPremium
                      ? 'linear-gradient(to right, #e2b744, #b88e1a)'
                      : 'linear-gradient(to right, var(--accent-cyan), var(--accent-blue))',
                  color: isClothing ? '#0e0e0f' : '#030812',
                }}
              >
                Add to Selection &bull; ${(fish.pricePerKg * quantity).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
