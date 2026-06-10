import React from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FishCardProps {
  fish: FishItem;
  onClick: () => void;
  unit?: string;
  storeType?: string;
}

export default function FishCard({ fish, onClick, unit, storeType }: FishCardProps) {
  const isPremium = fish.category === 'Premium Import' || fish.category === 'Jumbo Specials';
  const itemUnit = fish.unit || unit || 'kg';
  const type = storeType || 'seafood';
  const isClothing = type === 'clothing';

  if (isClothing) {
    // ── CLOTHING CARD ──────────────────────────────────────────
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: '16px',
          border: '1px solid rgba(180,140,100,0.14)',
          background: 'rgba(18,16,14,0.72)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          transition: 'box-shadow 0.3s, border-color 0.3s, transform 0.25s',
          height: '100%',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 28px rgba(212,169,106,0.25), 0 12px 40px rgba(0,0,0,0.6)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,169,106,0.4)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.5)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(180,140,100,0.14)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden' }}>
          <Image
            src={fish.image}
            alt={fish.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'cover', transition: 'transform 0.5s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)'; }}
          />
          {/* Overlay gradient */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(14,12,10,0.7) 0%, transparent 50%)',
            pointerEvents: 'none',
          }} />
          {/* Category badge */}
          <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <span style={{
              background: 'rgba(10,8,6,0.82)',
              border: '1px solid rgba(180,140,100,0.22)',
              color: '#a09484',
              padding: '3px 10px',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
            }}>{fish.category}</span>
            {/* Stock indicator */}
            {fish.stock > 0 && (
              <span style={{
                background: 'rgba(10,8,6,0.82)',
                border: '1px solid rgba(91,191,138,0.3)',
                color: '#5bbf8a',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.5px',
                backdropFilter: 'blur(8px)',
              }}>In Stock</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '18px 18px 16px 18px', gap: '10px' }}>
          {/* Fit / Cut */}
          <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#d4a96a', opacity: 0.9 }}>
            {fish.scientificName}
          </span>
          {/* Name */}
          <h3 style={{
            fontSize: '1.05rem', fontWeight: 700, color: '#f5f0eb',
            lineHeight: 1.3, margin: 0,
            transition: 'color 0.2s',
          }}>
            {fish.name}
          </h3>

          {/* Fabric tags */}
          {fish.tasteProfile && fish.tasteProfile.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {fish.tasteProfile.slice(0, 2).map((tag) => (
                <span key={tag} style={{
                  background: 'rgba(212,169,106,0.07)',
                  border: '1px solid rgba(212,169,106,0.18)',
                  color: '#a09484',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.63rem',
                  fontWeight: 600,
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Origin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#5a5048', fontSize: '0.75rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#d4a96a', opacity: 0.7, flexShrink: 0 }}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fish.origin}</span>
          </div>

          {/* Price + CTA */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 'auto', paddingTop: '12px',
            borderTop: '1px solid rgba(180,140,100,0.1)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#5a5048', fontWeight: 700, marginBottom: '2px' }}>Price</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f5f0eb' }}>
                ${fish.pricePerKg.toFixed(2)}
                <span style={{ fontSize: '0.72rem', color: '#5a5048', fontWeight: 400 }}> /{itemUnit}</span>
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              id={`select-btn-${fish.id}`}
              style={{
                height: '34px',
                padding: '0 16px',
                borderRadius: '8px',
                background: 'rgba(212,169,106,0.08)',
                border: '1px solid rgba(212,169,106,0.28)',
                color: '#d4a96a',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.background = 'linear-gradient(135deg,#d4a96a,#e8c47a)';
                (e.currentTarget).style.color = '#0e0e0f';
                (e.currentTarget).style.borderColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.background = 'rgba(212,169,106,0.08)';
                (e.currentTarget).style.color = '#d4a96a';
                (e.currentTarget).style.borderColor = 'rgba(212,169,106,0.28)';
              }}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SEAFOOD / DEFAULT CARD ──────────────────────────────────
  return (
    <Card
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[rgba(10,22,44,0.45)] backdrop-blur-md shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:shadow-[0_0_30px_rgba(0,242,254,0.35)] hover:border-[var(--accent-blue)] transition-all duration-350 cursor-pointer h-full"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <Image
          src={fish.image}
          alt={fish.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority={fish.id === 'bluefin-tuna'}
        />
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <Badge
            className="bg-[rgba(5,12,26,0.85)] border border-[var(--glass-border)] text-[var(--text-secondary)] font-medium px-2 py-0.5"
            variant="outline"
          >
            {fish.category}
          </Badge>
          {type === 'seafood' ? (
            isPremium ? (
              <Badge className="bg-gradient-to-r from-[#e2b744] to-[#b88e1a] text-[#030812] border-none font-bold shadow-[0_2px_8px_rgba(226,183,68,0.4)]">
                Rare
              </Badge>
            ) : (
              <Badge className="bg-gradient-to-r from-[var(--accent-teal)] to-[var(--accent-blue)] text-[#030812] border-none font-bold shadow-[0_2px_8px_rgba(56,189,248,0.3)]">
                {fish.sustainability === 'MSC Certified' ? 'MSC' : 'Wild'}
              </Badge>
            )
          ) : (
            <Badge className="bg-gradient-to-r from-[var(--accent-teal)] to-[var(--accent-blue)] text-[#030812] border-none font-bold shadow-[0_2px_8px_rgba(56,189,248,0.3)]">
              {fish.sustainability}
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-secondary)] block mb-1">
            {fish.scientificName}
          </span>
          <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-cyan)] transition-colors">
            {fish.name}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent-cyan)]"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{fish.origin}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[rgba(255,255,255,0.05)]">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-[var(--text-secondary)] font-bold mb-0.5">Price</span>
            <span className="text-base font-bold text-[var(--text-primary)]">
              ${fish.pricePerKg.toFixed(2)}
              <span className="text-xs text-[var(--text-secondary)] font-normal"> / {itemUnit}</span>
            </span>
          </div>

          <button
            className="h-9 px-4 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--glass-border)] text-xs font-semibold text-[var(--text-primary)] hover:bg-gradient-to-r hover:from-[var(--accent-cyan)] hover:to-[var(--accent-blue)] hover:text-[#030812] hover:border-transparent transition-all duration-200 cursor-pointer shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            id={`select-btn-${fish.id}`}
          >
            View Details
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
