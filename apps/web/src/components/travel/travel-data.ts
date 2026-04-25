import {
  Ambulance,
  Beef,
  Camera,
  Languages,
  LucideIcon,
  MapPinned,
  Shield,
  ShieldAlert,
  Sparkles,
  WalletCards,
  Wrench,
  Zap,
} from 'lucide-react';

export type NavItem = { label: string; icon: LucideIcon; href: string };
export const navItems: NavItem[] = [
  { label: 'Home', icon: Sparkles, href: '/' },
  { label: 'AI Assistant', icon: Zap, href: '/assistant' },
  { label: 'Translate', icon: Languages, href: '/translate' },
  { label: 'Food', icon: Beef, href: '/food' },
  { label: 'Essentials', icon: WalletCards, href: '/essentials' },
  { label: 'Scan', icon: Camera, href: '/scan' },
];

export type QuickAction = { label: string; icon: LucideIcon; iconClassName: string };
export const quickActions: QuickAction[] = [
  { label: 'Find Food', icon: Beef, iconClassName: 'from-orange-500 to-red-500' },
  { label: 'Translate', icon: Languages, iconClassName: 'from-violet-500 to-fuchsia-500' },
  { label: 'Scan Menu', icon: Camera, iconClassName: 'from-sky-500 to-blue-600' },
  { label: 'Essentials', icon: Zap, iconClassName: 'from-pink-500 to-rose-500' },
];

export type Suggestion = { emoji: string; title: string; subtitle: string; tag: string; gradientClassName: string };
export const suggestions: Suggestion[] = [
  { emoji: '🍜', title: 'Street Food Paradise', subtitle: 'Night market special', tag: 'Local favorite', gradientClassName: 'from-amber-500/35 to-orange-500/20' },
  { emoji: '☕', title: 'Hidden Coffee Gem', subtitle: 'Rooftop views', tag: 'Trending', gradientClassName: 'from-violet-500/35 to-indigo-500/20' },
  { emoji: '🛕', title: 'Temple District', subtitle: 'Cultural tour', tag: 'Must visit', gradientClassName: 'from-rose-500/35 to-pink-500/20' },
];

export type Tip = { title: string; description: string; icon: LucideIcon };
export const tips: Tip[] = [
  { title: 'Best time to visit temples', description: 'Early morning (8-9 AM) to avoid crowds and heat.', icon: MapPinned },
  { title: 'Currency tip', description: 'ATMs near tourist spots charge higher fees. Use local bank ATMs.', icon: WalletCards },
  { title: 'Popular right now', description: 'Night markets open at 6 PM. Get there early for best food selection.', icon: ShieldAlert },
];

export type EmergencyItem = { name: string; distance: string; cost: string; tag: string };
export type EmergencyCategory = { category: string; icon: LucideIcon; iconClassName: string; items: EmergencyItem[] };
export const emergencyData: EmergencyCategory[] = [
  {
    category: 'Medical Emergency',
    icon: Ambulance,
    iconClassName: 'bg-rose-500',
    items: [
      { name: 'City General Hospital', distance: '0.8 km', cost: '$$', tag: 'Tourist-friendly' },
      { name: '24/7 Medical Clinic', distance: '1.2 km', cost: '$', tag: 'English spoken' },
    ],
  },
  {
    category: 'Police / Safety',
    icon: Shield,
    iconClassName: 'bg-sky-500',
    items: [
      { name: 'Tourist Police Station', distance: '0.5 km', cost: 'Free', tag: 'Tourist-friendly' },
      { name: 'Central Police HQ', distance: '2.1 km', cost: 'Free', tag: '24/7' },
    ],
  },
  {
    category: 'Vehicle Breakdown',
    icon: Wrench,
    iconClassName: 'bg-amber-500',
    items: [{ name: 'Quick Fix Auto Service', distance: '1.5 km', cost: '$$', tag: 'Fast response' }],
  },
];
