import React from 'react';
import Image from 'next/image';
import { FishItem } from '@/data/fishData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface FishCardProps {
  fish: FishItem;
  onClick: () => void;
}

export default function FishCard({ fish, onClick }: FishCardProps) {
  const isPremium = fish.category === 'Premium Import';

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
          {isPremium ? (
            <Badge className="bg-gradient-to-r from-[#e2b744] to-[#b88e1a] text-[#030812] border-none font-bold shadow-[0_2px_8px_rgba(226,183,68,0.4)]">
              Rare
            </Badge>
          ) : (
            <Badge className="bg-gradient-to-r from-[var(--accent-teal)] to-[var(--accent-blue)] text-[#030812] border-none font-bold shadow-[0_2px_8px_rgba(56,189,248,0.3)]">
              {fish.sustainability === 'MSC Certified' ? 'MSC' : 'Wild'}
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
              <span className="text-xs text-[var(--text-secondary)] font-normal"> / kg</span>
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
