import { FishItem } from './fishData';

export interface StoreConfig {
  id?: string;
  ownerEmail?: string;
  storeName: string;
  storeTagline: string;
  storeType: 'seafood' | 'egg' | 'generic' | 'clothing';
  unit: string;
  categories: string[];
  storePhone?: string;
  storeAddress?: string;
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
  storeName: 'CataCloud',
  storeTagline: 'Landed Catch & Logistics Hub',
  storeType: 'seafood',
  unit: 'kg',
  categories: [],
  storePhone: '+1 (555) 347-4886',
  storeAddress: 'Pier 45, Fisherman\'s Wharf, San Francisco, CA',
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
  categories: [],
  storePhone: '+1 (555) 762-3447',
  storeAddress: 'Rural Route 4, Petaluma, CA',
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
  categories: [],
  storePhone: '+1 (555) 964-1017',
  storeAddress: '100 Market St, San Francisco, CA',
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

export const CLOTHING_PRESET: StoreConfig = {
  storeName: 'Threads & Co.',
  storeTagline: 'Premium Menswear & Essentials',
  storeType: 'clothing',
  unit: 'pcs',
  categories: [],
  storePhone: '+1 (555) 843-3237',
  storeAddress: '404 Fashion Ave, New York, NY',
  attributes: {
    specimenLabel: 'Garment Style',
    scientificNameLabel: 'Fit / Cut',
    tasteProfileLabel: 'Fabric & Material',
    textureLabel: 'Color / Pattern',
    sustainabilityLabel: 'Ethical Standard',
    difficultyLabel: 'Care Instructions'
  }
};

export const clothingSeedData: FishItem[] = [
  {
    id: 'casual-check-shirt-olive',
    name: 'Classic Checked Casual Shirt',
    scientificName: 'Regular Fit',
    category: 'Shirts',
    pricePerKg: 39.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 120,
    image: '/images/clothing/img_0063.jpg',
    description: 'Comfortable, everyday checked shirt crafted from premium lightweight cotton. Perfect for layering over a tee or wearing on its own.',
    tasteProfile: ['100% Breathable Cotton', 'Lightweight', 'Double-Stitched Seams'],
    texture: 'Olive & White Checkered',
    sustainability: 'OEKO-TEX Certified',
    prepTime: 'Machine wash cold with like colors',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'casual-linen-shirt-navy',
    name: 'Linen-Blend Casual Shirt',
    scientificName: 'Slim Fit',
    category: 'Shirts',
    pricePerKg: 45.00,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 95,
    image: '/images/clothing/img_0070.jpg',
    description: 'A lightweight linen-blend shirt designed for warm sunny days. Features a soft collar and curved hem.',
    tasteProfile: ['55% Linen, 45% Cotton', 'Highly Breathable', 'Moisture-Wicking'],
    texture: 'Navy Blue Solid',
    sustainability: 'Locally Sourced Fibers',
    prepTime: 'Hand wash recommended, hang dry',
    difficulty: 'Medium Care',
    unit: 'pcs'
  },
  {
    id: 'formal-oxford-shirt-white',
    name: 'Classic White Oxford Shirt',
    scientificName: 'Tailored Fit',
    category: 'Shirts',
    pricePerKg: 59.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 80,
    image: '/images/clothing/img_0002.jpg',
    description: 'A crisp, wrinkle-resistant formal shirt suitable for business meetings and black-tie events. Finished with mother-of-pearl buttons.',
    tasteProfile: ['100% Egyptian Cotton', 'Wrinkle-Resistant', 'High-Thread Count'],
    texture: 'Pristine White Solid',
    sustainability: 'Fair Trade Certified',
    prepTime: 'Dry clean or warm machine wash, iron damp',
    difficulty: 'Professional Care',
    unit: 'pcs'
  },
  {
    id: 'formal-sateen-shirt-grey',
    name: 'Sateen Luxe Dress Shirt',
    scientificName: 'Super Slim Fit',
    category: 'Shirts',
    pricePerKg: 64.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 75,
    image: '/images/clothing/img_0010.jpg',
    description: 'Sophisticated formal dress shirt with a subtle sateen sheen. Offers a sleek profile and exceptional stretch comfort.',
    tasteProfile: ['97% Sateen Cotton, 3% Elastane', 'Satin Finish', 'Four-way Stretch'],
    texture: 'Charcoal Grey Sheen',
    sustainability: 'Responsibly Manufactured',
    prepTime: 'Machine wash warm, tumble dry low, light iron',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'formal-trouser-charcoal',
    name: 'Premium Charcoal Dress Trousers',
    scientificName: 'Straight Fit / Flat Front',
    category: 'Pants',
    pricePerKg: 69.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 60,
    image: '/images/clothing/img_0165.jpg',
    description: 'Expertly tailored formal trousers perfect for the modern professional. Crafted with a clean flat-front crease and adjustable waistband.',
    tasteProfile: ['70% Wool, 30% Polyester', 'Structured Crease', 'Stretch Waistband'],
    texture: 'Charcoal Grey Textured',
    sustainability: 'Eco-Friendly Dyeing Process',
    prepTime: 'Dry clean only, steam to de-wrinkle',
    difficulty: 'Professional Care',
    unit: 'pcs'
  },
  {
    id: 'formal-trouser-beige',
    name: 'Classic Beige Chino Trousers',
    scientificName: 'Slim Straight Fit',
    category: 'Pants',
    pricePerKg: 49.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 110,
    image: '/images/clothing/img_0172.jpg',
    description: 'Polished chinos that transition effortlessly from office hours to evening dinner. Features a soft-brushed finish for ultimate comfort.',
    tasteProfile: ['98% Cotton twill, 2% Spandex', 'Soft Brushed Finish', 'Reinforced Stitching'],
    texture: 'Beige Chino Solid',
    sustainability: 'Better Cotton Initiative (BCI)',
    prepTime: 'Machine wash cold, tumble dry medium',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'denim-jeans-indigo',
    name: 'Premium Indigo Selvedge Jeans',
    scientificName: 'Tapered Fit',
    category: 'Jeans',
    pricePerKg: 89.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 50,
    image: '/images/clothing/img_0378.jpg',
    description: 'Classic raw denim jeans featuring selvedge detail. Built to conform to your body over time for a custom fit.',
    tasteProfile: ['100% Selvedge Denim', 'Heavyweight 14oz', 'Raw & Unwashed'],
    texture: 'Deep Indigo Blue',
    sustainability: 'Zero-Water-Waste Wash Process',
    prepTime: 'Wash sparingly, inside out, in cold water',
    difficulty: 'Special Care',
    unit: 'pcs'
  },
  {
    id: 'denim-jeans-washed',
    name: 'Stretched Washed Denim Jeans',
    scientificName: 'Slim Fit',
    category: 'Jeans',
    pricePerKg: 59.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 85,
    image: '/images/clothing/img_0382.jpg',
    description: 'Comfort-stretch denim jeans pre-washed for a soft, worn-in feel. Detailed with light whiskering and fading.',
    tasteProfile: ['98% Denim Cotton, 2% Lycra', 'Medium Weight 11oz', 'Pre-shrunk Soft Touch'],
    texture: 'Mid-Wash Blue Distressed',
    sustainability: 'Recycled Cotton Blend',
    prepTime: 'Machine wash cold, tumble dry low',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'cargo-pants-khaki',
    name: 'Military Combat Cargo Pants',
    scientificName: 'Relaxed Utility Fit',
    category: 'Cargos',
    pricePerKg: 54.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 90,
    image: '/images/clothing/img_0147.jpg',
    description: 'Robust cargo trousers featuring spacious side-flap pockets and reinforced seat. Built for outdoor adventures and utility streetwear.',
    tasteProfile: ['100% Cotton Ripstop', 'Heavy Duty Utility', 'Reinforced Knees'],
    texture: 'Desert Khaki Solid',
    sustainability: 'Eco-Shield Durable Water Repellent',
    prepTime: 'Machine wash warm, tumble dry normal',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'cargo-pants-black',
    name: 'Urban Slim Combat Cargos',
    scientificName: 'Slim Cargo Fit',
    category: 'Cargos',
    pricePerKg: 57.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 80,
    image: '/images/clothing/img_0171.jpg',
    description: 'Modern slim-fit cargo pants with low-profile pocket compartments. Provides a sleek silhouette while maintaining high functionality.',
    tasteProfile: ['97% Cotton, 3% Lycra Twill', 'Durable Stretch', 'Secure Zipper Pockets'],
    texture: 'Matte Black Solid',
    sustainability: 'Standard 100 by OEKO-TEX',
    prepTime: 'Machine wash cold inside out',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'hoodie-printed-retro',
    name: 'Retro Graphic Printed Hoodie',
    scientificName: 'Oversized Fit',
    category: 'Hoodies',
    pricePerKg: 49.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 70,
    image: '/images/clothing/img_0039.jpg',
    description: 'Cozy oversized hoodie featuring a retro-inspired vintage graphic print on the front. Made from ultra-soft cotton fleece.',
    tasteProfile: ['80% Cotton, 20% Polyester Fleece', 'Heavyweight 400 GSM', 'Brushed Interior'],
    texture: 'Vintage Black Graphic',
    sustainability: 'Global Organic Textile Standard (GOTS)',
    prepTime: 'Machine wash cold, dry flat to protect print',
    difficulty: 'Medium Care',
    unit: 'pcs'
  },
  {
    id: 'hoodie-printed-minimal',
    name: 'Minimalist Printed Pullover Hoodie',
    scientificName: 'Regular Fit',
    category: 'Hoodies',
    pricePerKg: 44.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 85,
    image: '/images/clothing/img_0047.jpg',
    description: 'Sleek pullover hoodie detailed with a small minimalist embroidery/print at the chest. Features a double-lined hood and metal tip drawstrings.',
    tasteProfile: ['100% Organic Cotton French Terry', 'Midweight 320 GSM', 'Loopback Knit'],
    texture: 'Sage Green Minimalist',
    sustainability: '100% Certified Organic Cotton',
    prepTime: 'Machine wash cold, line dry',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'tshirt-printed-abstract',
    name: 'Abstract Art Graphic T-Shirt',
    scientificName: 'Oversized Street Fit',
    category: 'T-Shirts',
    pricePerKg: 29.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 150,
    image: '/images/clothing/img_0003.jpg',
    description: 'Bold street-fashion tee featuring custom abstract artwork screen-printed across the back and chest. Crafted from heavyweight combed cotton.',
    tasteProfile: ['100% Combed Cotton', 'Heavyweight 240 GSM', 'Ribbed Crewneck'],
    texture: 'Off-White Abstract Print',
    sustainability: 'Eco-Friendly Screen Printing Inks',
    prepTime: 'Wash inside out in cold water, do not iron print',
    difficulty: 'Medium Care',
    unit: 'pcs'
  },
  {
    id: 'tshirt-printed-vintage',
    name: 'Vintage Classic Graphic Tee',
    scientificName: 'Regular Fit',
    category: 'T-Shirts',
    pricePerKg: 27.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 140,
    image: '/images/clothing/img_0007.jpg',
    description: 'A classic cotton graphic tee with a distressed retro logo print. Heavily washed for that authentic pre-loved vintage feel.',
    tasteProfile: ['100% Ringspun Cotton', 'Super-Soft Feel', 'Single-Stitch Detailing'],
    texture: 'Faded Charcoal Retro Print',
    sustainability: 'Recycled Fabric Blend',
    prepTime: 'Machine wash cold, tumble dry low',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'tshirt-solid-crew-black',
    name: 'Classic Solid Crewneck T-Shirt',
    scientificName: 'Regular Fit',
    category: 'T-Shirts',
    pricePerKg: 24.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 200,
    image: '/images/clothing/img_0001.jpg',
    description: 'The ultimate wardrobe staple. A clean, premium crewneck t-shirt made of long-staple cotton with a silky-smooth mercerized finish.',
    tasteProfile: ['100% Mercerized Cotton', 'Interlock Knit', 'Anti-Pilling Finish'],
    texture: 'Jet Black Solid',
    sustainability: 'Carbon-Neutral Manufacture',
    prepTime: 'Machine wash cold, tumble dry low',
    difficulty: 'Easy Care',
    unit: 'pcs'
  },
  {
    id: 'tshirt-solid-pima-white',
    name: 'Premium Pima Cotton Tee',
    scientificName: 'Slim Fit',
    category: 'T-Shirts',
    pricePerKg: 26.99,
    origin: 'Premium Indian Cotton / Tamil Nadu',
    stock: 180,
    image: '/images/clothing/img_0018.jpg',
    description: 'An exceptionally soft tee made from long-staple Pima cotton. Breathable, durable, and retains its shape and color wash after wash.',
    tasteProfile: ['100% Peruvian Pima Cotton', 'High Tensile Strength', 'Silky Smooth Finish'],
    texture: 'Optic White Solid',
    sustainability: 'Sustainably Hand-Harvested',
    prepTime: 'Wash cold, air dry to avoid shrinkage',
    difficulty: 'Easy Care',
    unit: 'pcs'
  }
];

