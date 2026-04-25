import { EmergencyCard } from './emergency-card';
import { EmergencyCategory } from './travel-data';

export function EmergencySection({ section }: { section: EmergencyCategory }) {
  const Icon = section.icon;
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl text-white ${section.iconClassName}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-2xl font-semibold text-white">{section.category}</h3>
      </div>
      <div className="space-y-3">{section.items.map((item) => <EmergencyCard key={item.name} item={item} />)}</div>
    </section>
  );
}
