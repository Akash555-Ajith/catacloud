export interface FishItem {
  id: string;
  name: string;
  scientificName: string;
  category: string;
  pricePerKg: number;
  origin: string;
  stock: number;
  image: string;
  description: string;
  tasteProfile: string[];
  texture: string;
  sustainability: string;
  prepTime: string;
  difficulty: string;
  unit?: string; // unit of measurement: kg, L, pcs, etc.
}

export const fishData: FishItem[] = [
  {
    id: 'bluefin-tuna',
    name: 'Bluefin Tuna (Hon-Maguro)',
    scientificName: 'Thunnus thynnus',
    category: 'Premium Import',
    pricePerKg: 120.0,
    origin: 'Hokkaido, Japan',
    stock: 12,
    image: '/images/bluefin_tuna.png',
    description: 'Highly prized sashimi-grade Bluefin Tuna cut from the belly (Otoro) and loin (Akami). Renowned for its marbled fat content and deep umami richness.',
    tasteProfile: ['Buttery', 'Rich', 'Umami', 'Subtly Sweet'],
    texture: 'Melt-in-your-mouth, velvety',
    sustainability: 'MSC Certified',
    prepTime: '5 mins (Sashimi) / 10 mins (Seared)',
    difficulty: 'Easy'
  },
  {
    id: 'king-salmon',
    name: 'King Salmon (Chinook)',
    scientificName: 'Oncorhynchus tshawytscha',
    category: 'Saltwater',
    pricePerKg: 45.0,
    origin: 'Copper River, Alaska',
    stock: 25,
    image: '/images/king_salmon.png',
    description: 'The monarch of wild salmon. King Salmon has the highest oil content of any salmon species, rendering it exceptionally flavorful, rich, and loaded with Omega-3s.',
    tasteProfile: ['Rich', 'Fatty', 'Mildly Sweet'],
    texture: 'Velvety, large delicate flakes',
    sustainability: 'Wild Caught',
    prepTime: '15 mins (Grilled / Pan-roasted)',
    difficulty: 'Easy'
  },
  {
    id: 'diver-scallops',
    name: 'Maine Diver Scallops',
    scientificName: 'Placopecten magellanicus',
    category: 'Shellfish',
    pricePerKg: 55.0,
    origin: 'Gulf of Maine, USA',
    stock: 18,
    image: '/images/diver_scallops.png',
    description: 'Hand-harvested by divers in the cold waters of Maine. These dry-packed scallops contain no added water or chemicals, yielding an incomparable sear and sweet finish.',
    tasteProfile: ['Sweet', 'Buttery', 'Briny'],
    texture: 'Plump, tender, pillowy',
    sustainability: 'Wild Caught',
    prepTime: '8 mins (Pan-seared)',
    difficulty: 'Medium'
  },
  {
    id: 'tiger-prawns',
    name: 'Jumbo Tiger Prawns',
    scientificName: 'Penaeus monodon',
    category: 'Shellfish',
    pricePerKg: 35.0,
    origin: 'Madagascar Coastal Waters',
    stock: 40,
    image: '/images/tiger_prawns.png',
    description: 'Magnificent, colossal prawns characterized by tiger-stripe markings on their shells. They present a bold, sweet seafood flavor and crisp snap.',
    tasteProfile: ['Sweet-Savory', 'Clean', 'Lobster-like'],
    texture: 'Firm, dense, crunchy snap',
    sustainability: 'Sustainably Farmed',
    prepTime: '10 mins (Garlic Grilled / Butter-poached)',
    difficulty: 'Easy'
  },
  {
    id: 'red-snapper',
    name: 'Gulf Red Snapper',
    scientificName: 'Lutjanus campechanus',
    category: 'Saltwater',
    pricePerKg: 28.0,
    origin: 'Gulf of Mexico',
    stock: 15,
    image: '/images/red_snapper.png',
    description: 'A versatile crowd favorite. Red Snapper boasts clean white flesh with a bright red skin, offering a beautifully mild flavor profile that pairs elegantly with herbs and citrus.',
    tasteProfile: ['Mild', 'Nutty', 'Sweet'],
    texture: 'Lean, moist, medium-firm',
    sustainability: 'Wild Caught',
    prepTime: '20 mins (Whole roasted / Pan-fried)',
    difficulty: 'Medium'
  },
  {
    id: 'atlantic-halibut',
    name: 'Atlantic Halibut Steak',
    scientificName: 'Hippoglossus hippoglossus',
    category: 'Saltwater',
    pricePerKg: 38.0,
    origin: 'North Atlantic Ocean',
    stock: 8,
    image: '/images/atlantic_halibut.png',
    description: 'Thick, cold-water halibut steaks cut from large, wild-caught flatfish. Mild and meaty, it behaves almost like a poultry cut, absorbing broths and compound butter beautifully.',
    tasteProfile: ['Clean', 'Gentle', 'Buttery'],
    texture: 'Dense, meaty, firm flakes',
    sustainability: 'MSC Certified',
    prepTime: '18 mins (Baked / Poached)',
    difficulty: 'Medium'
  }
];
