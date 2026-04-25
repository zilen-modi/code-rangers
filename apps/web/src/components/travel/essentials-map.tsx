'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';

export function EssentialsMap({
  locations,
}: {
  locations: Array<{ name: string; distance: string; cost: string; note: string; lat: number; lng: number }>;
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const center = useMemo<[number, number]>(() => (locations.length ? [locations[0].lat, locations[0].lng] : [13.7563, 100.5018]), [locations]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
    };
  }, [center]);

  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();
    locations.forEach((location) => {
      L.circleMarker([location.lat, location.lng], { radius: 8, color: '#f472b6', weight: 2, fillColor: '#a855f7', fillOpacity: 0.9 })
        .bindPopup(`<div><b>${location.name}</b><br/>${location.distance} • ${location.cost}<br/>${location.note}</div>`)
        .addTo(markersLayerRef.current as L.LayerGroup);
    });
    if (locations.length) mapInstanceRef.current.setView([locations[0].lat, locations[0].lng], 14);
  }, [locations]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-3 shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur-xl">
      <div ref={mapRef} className="h-[320px] overflow-hidden rounded-xl border border-white/10" />
    </section>
  );
}
