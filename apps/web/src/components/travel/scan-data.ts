export type ScanMenuItem = {
  name: string;
  original: string;
  description: string;
  spice: number;
  allergens: string[];
  recommended?: boolean;
};

export const initialMenuItems: ScanMenuItem[] = [
  { name: 'Pad Thai', original: 'ผัดไทย', description: 'Stir-fried rice noodles with shrimp, tofu, peanuts, and tamarind sauce.', spice: 2, allergens: ['Peanuts', 'Shellfish'], recommended: true },
  { name: 'Tom Yum Goong', original: 'ต้มยำกุ้ง', description: 'Hot and sour shrimp soup with lemongrass, lime leaves, and mushrooms.', spice: 3, allergens: ['Shellfish'] },
  { name: 'Mango Sticky Rice', original: 'ข้าวเหนียวมะม่วง', description: 'Sweet sticky rice with fresh mango and coconut cream.', spice: 0, allergens: ['Dairy'] },
];

export const translatedMenuItems: ScanMenuItem[] = [
  { name: 'Pad Thai', original: 'Thai stir-fried noodles', description: 'Rice noodles wok-fried with shrimp, tofu, peanuts, and tamarind sauce.', spice: 2, allergens: ['Peanuts', 'Shellfish'], recommended: true },
  { name: 'Tom Yum Goong', original: 'Spicy shrimp soup', description: 'A signature hot and sour soup with shrimp and aromatic herbs.', spice: 3, allergens: ['Shellfish'] },
  { name: 'Mango Sticky Rice', original: 'Sweet mango rice', description: 'Classic dessert with coconut sticky rice and ripe mango.', spice: 0, allergens: ['Dairy'] },
];
