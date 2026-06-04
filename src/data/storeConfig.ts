import { FishItem } from './fishData';

export interface StoreConfig {
  id?: string;
  ownerEmail?: string;
  storeName: string;
  storeTagline: string;
  storeType: 'seafood' | 'egg' | 'generic';
  unit: string;
  categories: string[];
  attributes: {
    specimenLabel: string;      // e.g. "Specimen" or "Product Type"
    scientificNameLabel: string; // e.g. "Scientific Name" or "Grade / Size"
    tasteProfileLabel: string;   // e.g. "Taste Profile" or "Key Features"
    textureLabel: string;        // e.g. "Texture" or "Yolk Color"
    sustainabilityLabel: string; // e.g. "Sustainability" or "Farming Method"
    difficultyLabel: string;     // e.g. "Difficulty" or "Storage Temperature"
  };
}

export const SEAFOOD_PRESET: StoreConfig = {
  storeName: 'Bluefine',
  storeTagline: 'Landed Catch & Logistics Hub',
  storeType: 'seafood',
  unit: 'kg',
  categories: ['Saltwater', 'Freshwater', 'Shellfish', 'Premium Import'],
  attributes: {
    specimenLabel: 'Specimen',
    scientificNameLabel: 'Scientific Name',
    tasteProfileLabel: 'Taste Profile',
    textureLabel: 'Texture',
    sustainabilityLabel: 'Sustainability',
    difficultyLabel: 'Preparation Difficulty'
  }
};

export const EGG_PRESET: StoreConfig = {
  storeName: 'Eggcellent',
  storeTagline: 'Organic Farm Egg Supplier',
  storeType: 'egg',
  unit: 'dozen',
  categories: ['Free-Range', 'Organic', 'Jumbo Specials', 'Liquid & Egg Whites'],
  attributes: {
    specimenLabel: 'Egg Variety',
    scientificNameLabel: 'Grade / Size',
    tasteProfileLabel: 'Key Features',
    textureLabel: 'Yolk Color',
    sustainabilityLabel: 'Farming Method',
    difficultyLabel: 'Handling Care'
  }
};

export const GENERIC_PRESET: StoreConfig = {
  storeName: 'NicheMarket',
  storeTagline: 'Boutique Goods & Provisions',
  storeType: 'generic',
  unit: 'pcs',
  categories: ['Featured', 'New Arrivals', 'Clearance', 'Bestsellers'],
  attributes: {
    specimenLabel: 'Product Item',
    scientificNameLabel: 'Model / Grade',
    tasteProfileLabel: 'Features',
    textureLabel: 'Color / Style',
    sustainabilityLabel: 'Production Standard',
    difficultyLabel: 'Handling Level'
  }
};

export const eggSeedData: FishItem[] = [
  {
    id: 'organic-brown-eggs',
    name: 'Organic Brown Eggs (Dozen)',
    scientificName: 'Grade AA Large',
    category: 'Organic',
    pricePerKg: 6.50,
    origin: 'Sunshine Valley Farms',
    stock: 120,
    image: 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=300&q=80',
    description: 'Freshly gathered pasture-raised organic brown eggs. Rich in Omega-3 and essential vitamins, with thick egg whites and plump, deep orange yolks.',
    tasteProfile: ['Omega-3 Rich', 'Pasture Raised', 'Non-GMO Feed'],
    texture: 'Deep Orange Yolk',
    sustainability: 'Free-Range Pasture',
    prepTime: 'Keep refrigerated (3-5°C)',
    difficulty: 'Easy',
    unit: 'dozen'
  },
  {
    id: 'pasture-duck-eggs',
    name: 'Pasture-Raised Duck Eggs (6-Pack)',
    scientificName: 'Grade A Jumbo',
    category: 'Free-Range',
    pricePerKg: 9.00,
    origin: 'Meadow Brook Farms',
    stock: 45,
    image: 'https://images.unsplash.com/photo-1598965402089-897ce52e8355?auto=format&fit=crop&w=300&q=80',
    description: 'Rich, extra-creamy jumbo duck eggs gathered from free-range foraging ducks. Excellent for baking, giving cakes and pastries a lighter, loftier rise.',
    tasteProfile: ['Extra Creamy', 'High Protein', 'Rich Yolk'],
    texture: 'Golden Yellow Yolk',
    sustainability: 'Pasture Foraged',
    prepTime: 'Keep refrigerated (3-5°C)',
    difficulty: 'Medium',
    unit: '6-pack'
  },
  {
    id: 'quail-eggs-pack',
    name: 'Gourmet Quail Eggs (12-Pack)',
    scientificName: 'Premium Small',
    category: 'Jumbo Specials',
    pricePerKg: 8.50,
    origin: 'Highland Aviaries',
    stock: 60,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    description: 'Delicately speckled miniature quail eggs. A gourmet favorite for salads, appetizers, and fine-dining hors d\'oeuvres.',
    tasteProfile: ['Delicate Flavor', 'Bite-sized', 'Gourmet Accent'],
    texture: 'Pale Yellow Yolk',
    sustainability: 'Responsibly Housed',
    prepTime: 'Keep refrigerated (3-5°C)',
    difficulty: 'Medium',
    unit: '12-pack'
  },
  {
    id: 'liquid-egg-whites',
    name: 'Pasteurized Liquid Egg Whites (1L)',
    scientificName: 'USP Grade Pure',
    category: 'Liquid & Egg Whites',
    pricePerKg: 7.00,
    origin: 'Midwest Ag Processing',
    stock: 80,
    image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=300&q=80',
    description: 'Pure pasteurized liquid egg whites. Convenient and ready to pour, ideal for high-protein diets, protein shakes, meringues, and baking.',
    tasteProfile: ['Fat-Free', 'Cholesterol-Free', 'Pure Albumin'],
    texture: 'Clear Egg Whites',
    sustainability: 'Pasteurized Recyclable',
    prepTime: 'Use within 7 days of opening',
    difficulty: 'Easy',
    unit: 'L'
  }
];

export const genericSeedData: FishItem[] = [
  {
    id: 'artisan-bread-loaf',
    name: 'Sourdough Country Loaf',
    scientificName: 'Artisan Grade A',
    category: 'Featured',
    pricePerKg: 5.50,
    origin: 'Golden Hearth Bakery',
    stock: 30,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80',
    description: 'Crusty artisan sourdough country loaf baked fresh daily. Made using a wild-ferment starter for a rich, tangy flavor and open crumb.',
    tasteProfile: ['Wild Ferment', 'Unbleached Flour', 'Baked Fresh'],
    texture: 'Rustic Brown',
    sustainability: 'Local Organic Wheat',
    prepTime: 'Store in breadbox (2-3 days)',
    difficulty: 'Easy',
    unit: 'loaf'
  },
  {
    id: 'organic-honey-jar',
    name: 'Raw Wildflower Honey (500g)',
    scientificName: 'Raw Unfiltered',
    category: 'Featured',
    pricePerKg: 12.00,
    origin: 'Bee Sweet Apiaries',
    stock: 50,
    image: 'https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=300&q=80',
    description: 'Raw, unfiltered wildflower honey. Harvested from protected wildflower meadows, retaining natural pollens and enzymes.',
    tasteProfile: ['Floral', 'Unheated', 'Rich Sweetness'],
    texture: 'Amber Gold',
    sustainability: 'Eco-Friendly Apiary',
    prepTime: 'Store at room temperature',
    difficulty: 'Easy',
    unit: 'jar'
  }
];
