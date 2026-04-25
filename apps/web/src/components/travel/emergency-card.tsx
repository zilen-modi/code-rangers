import { Navigation, PhoneCall } from 'lucide-react';
import { ActionButton } from './action-button';
import { EmergencyItem } from './travel-data';

export function EmergencyCard({ item }: { item: EmergencyItem }) {
  return (
    <article className="rounded-xl border border-[#313A4C] bg-[#1A2130] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:border-[#3F4C65]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h4 className="text-lg font-semibold text-white">{item.name}</h4>
        <span className="inline-flex shrink-0 rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">{item.tag}</span>
      </div>
      <p className="text-sm text-slate-300">{item.distance} <span className="ml-2">{item.cost}</span></p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <ActionButton label="Call" icon={PhoneCall} variant="call" />
        <ActionButton label="Navigate" icon={Navigation} variant="navigate" />
      </div>
    </article>
  );
}
