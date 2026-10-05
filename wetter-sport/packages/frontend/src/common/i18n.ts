import { useSyncExternalStore } from 'react';

export type Lang = 'de' | 'en';

const de = {
  'class.sunny': 'Sonnig & warm',
  'class.mixed': 'Wechselhaft',
  'class.rain': 'Regen',
  'class.cold': 'Kalt',
  'profile.sunny': 'Schönwetter-Artikel',
  'profile.rain': 'Regen-Artikel',
  'profile.cold': 'Kälte-Artikel',
  'profile.mixed': 'Wechselhaft',
  'profile.neutral': 'Wetterunabhängig',
  'short.sunny': 'Sonne',
  'short.rain': 'Regen',
  'short.cold': 'Kälte',
  'code.sunny': 'Sonnig',
  'code.fair': 'Heiter',
  'code.overcast': 'Bedeckt',
  'code.fog': 'Nebel',
  'code.drizzle': 'Niesel',
  'code.rain': 'Regen',
  'code.snow': 'Schnee',
  'code.storm': 'Gewitter',
  'demo.banner': 'Beispieldaten: erfundene Sportartikel mit echtem Wetter.',
  'demo.showReal': 'Echte Daten anzeigen',
  'demo.showDemo': 'Beispieldaten anzeigen',
  'location.search': 'Ort suchen, z. B. München',
  'error.load': 'Fehler beim Laden: {msg}',
  'pane.pick': 'Wähle einen Artikel aus, um seine Verkäufe mit dem Wetter zu sehen.',
  'pane.noSales': 'Keine Verkäufe in den letzten {days} Tagen.',
  'pane.unknownItem': 'Unbekannter Artikel',
  'pane.sold': 'Verkauft ({days} T.)',
  'pane.stock': 'Bestand verfügbar',
  'pane.liftBefore': 'Bei',
  'pane.liftAfter': 'verkauft sich dieser Artikel {lift}× so oft wie im Durchschnitt.',
  'pane.byWeather': 'Ø Verkauf pro Tag nach Wetter',
  'pane.avgPerDay': 'Ø Stück/Tag',
  'pane.days': 'Tage',
  'pane.lastDays': 'Letzte Verkaufstage',
  'pane.none': 'Noch keine Verkäufe.',
  'pane.noWeather': 'Wetter nicht verfügbar',
  'pane.orders1': '1 Auftrag',
  'pane.ordersN': '{n} Aufträge',
  'pane.source': 'Wetter: {place}, Open-Meteo',
  'unit.pcs': '{n} Stk.',
  'dash.title': 'Wetter & Nachbestellung',
  'dash.subtitle': '7-Tage-Prognose und Artikel, die bei diesem Wetter knapp werden',
  'dash.today': 'Heute',
  'dash.noSales': 'In deinem ERP wurden in den letzten 180 Tagen keine Verkäufe gefunden.',
  'kpi.sunny': 'Sonnige Tage',
  'kpi.rain': 'Regentage',
  'kpi.reorder': 'Nachbestellen',
  'kpi.weather': 'Davon wegen Wetter',
  'kpi.ofSeven': '{n} von 7',
  'kpi.items': '{n} Artikel',
  'chart.temp': 'Temperatur',
  'chart.tempSub': 'Höchst- und Tiefstwert pro Tag, °C',
  'chart.max': 'Höchstwert',
  'chart.min': 'Tiefstwert',
  'chart.rain': 'Niederschlag',
  'chart.rainSub': 'Erwartete Regenmenge pro Tag, mm',
  'chart.demand': 'Erwartete Nachfrage',
  'chart.demandSub': 'Stück pro Tag über alle Artikel, nach Wetterlage des Tages',
  'chart.expected': 'Erwartet',
  'chart.weather': 'Wetter',
  'chart.stockVsDemand': 'Bestand vs. Bedarf',
  'chart.stockVsDemandSub': 'Bestand inkl. Zulauf und erwarteter Bedarf der nächsten 7 Tage, Stück',
  'chart.stock': 'Bestand',
  'chart.demand7': 'Bedarf 7 Tage',
  'reorder.title': 'Nachbestellvorschläge',
  'reorder.subtitle': 'Artikel, deren Bestand den erwarteten Bedarf der nächsten 7 Tage nicht deckt. Wetterbedingte zuerst.',
  'reorder.onlyWeather': 'Nur wetterbedingte',
  'reorder.item': 'Artikel',
  'reorder.profile': 'Wetterprofil',
  'reorder.stock': 'Bestand',
  'reorder.incoming': 'Zulauf',
  'reorder.demand': 'Bedarf 7 T.',
  'reorder.cover': 'Reicht für',
  'reorder.suggest': 'Vorschlag',
  'reorder.byWeather': '+{pct} % durch Wetter',
  'reorder.days': '{n} Tage',
  'reorder.allGood': 'Alle Bestände reichen für die nächsten 7 Tage.',
  'footer.basis': 'Grundlage: {source} der letzten 180 Tage und das Wetter am Verkaufstag ({place}, Open-Meteo).',
  'footer.demo': 'Beispieldaten',
  'footer.lines': '{n} Auftragspositionen',
  'footer.formula': 'Vorschlag = erwarteter Bedarf × 1,2 + Mindestbestand - Bestand - Zulauf.',
};

type Key = keyof typeof de;

const en: Record<Key, string> = {
  'class.sunny': 'Sunny & warm',
  'class.mixed': 'Changeable',
  'class.rain': 'Rain',
  'class.cold': 'Cold',
  'profile.sunny': 'Fair-weather item',
  'profile.rain': 'Rain item',
  'profile.cold': 'Cold-weather item',
  'profile.mixed': 'Changeable',
  'profile.neutral': 'Weather-independent',
  'short.sunny': 'sunshine',
  'short.rain': 'rain',
  'short.cold': 'cold weather',
  'code.sunny': 'Sunny',
  'code.fair': 'Fair',
  'code.overcast': 'Overcast',
  'code.fog': 'Fog',
  'code.drizzle': 'Drizzle',
  'code.rain': 'Rain',
  'code.snow': 'Snow',
  'code.storm': 'Thunderstorm',
  'demo.banner': 'Sample data: made-up sports items with real weather.',
  'demo.showReal': 'Show real data',
  'demo.showDemo': 'Show sample data',
  'location.search': 'Search a place, e.g. Munich',
  'error.load': 'Could not load: {msg}',
  'pane.pick': 'Select an item to see its sales together with the weather.',
  'pane.noSales': 'No sales in the last {days} days.',
  'pane.unknownItem': 'Unknown item',
  'pane.sold': 'Sold ({days} d)',
  'pane.stock': 'Stock available',
  'pane.liftBefore': 'In',
  'pane.liftAfter': 'this item sells {lift}× as often as on average.',
  'pane.byWeather': 'Avg. sales per day by weather',
  'pane.avgPerDay': 'Avg. pcs/day',
  'pane.days': 'Days',
  'pane.lastDays': 'Recent sales days',
  'pane.none': 'No sales yet.',
  'pane.noWeather': 'Weather not available',
  'pane.orders1': '1 order',
  'pane.ordersN': '{n} orders',
  'pane.source': 'Weather: {place}, Open-Meteo',
  'unit.pcs': '{n} pcs',
  'dash.title': 'Weather & Reordering',
  'dash.subtitle': '7-day forecast and items that will run low in this weather',
  'dash.today': 'Today',
  'dash.noSales': 'No sales were found in your ERP for the last 180 days.',
  'kpi.sunny': 'Sunny days',
  'kpi.rain': 'Rainy days',
  'kpi.reorder': 'To reorder',
  'kpi.weather': 'Due to weather',
  'kpi.ofSeven': '{n} of 7',
  'kpi.items': '{n} items',
  'chart.temp': 'Temperature',
  'chart.tempSub': 'Daily high and low, °C',
  'chart.max': 'High',
  'chart.min': 'Low',
  'chart.rain': 'Precipitation',
  'chart.rainSub': 'Expected rain per day, mm',
  'chart.demand': 'Expected demand',
  'chart.demandSub': 'Pieces per day across all items, by the day’s weather',
  'chart.expected': 'Expected',
  'chart.weather': 'Weather',
  'chart.stockVsDemand': 'Stock vs. demand',
  'chart.stockVsDemandSub': 'Stock incl. incoming and expected demand for the next 7 days, pieces',
  'chart.stock': 'Stock',
  'chart.demand7': 'Demand 7 days',
  'reorder.title': 'Reorder suggestions',
  'reorder.subtitle': 'Items whose stock does not cover the expected demand of the next 7 days. Weather-driven first.',
  'reorder.onlyWeather': 'Weather-driven only',
  'reorder.item': 'Item',
  'reorder.profile': 'Weather profile',
  'reorder.stock': 'Stock',
  'reorder.incoming': 'Incoming',
  'reorder.demand': 'Demand 7 d',
  'reorder.cover': 'Lasts for',
  'reorder.suggest': 'Suggestion',
  'reorder.byWeather': '+{pct} % due to weather',
  'reorder.days': '{n} days',
  'reorder.allGood': 'All stock levels cover the next 7 days.',
  'footer.basis': 'Based on {source} from the last 180 days and the weather on the day of sale ({place}, Open-Meteo).',
  'footer.demo': 'sample data',
  'footer.lines': '{n} order lines',
  'footer.formula': 'Suggestion = expected demand × 1.2 + minimum stock - stock - incoming.',
};

const LANG_KEY = 'wetter-sport-lang';
const listeners = new Set<() => void>();

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'de' || saved === 'en') return saved;
  } catch {
    // storage blocked
  }
  return navigator.language.startsWith('de') ? 'de' : 'en';
}

let current: Lang = initialLang();

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // storage blocked: the choice only lasts for this page view
  }
  listeners.forEach(l => l());
}

/** Re-renders the calling component when the language changes. */
export function useLang(): Lang {
  return useSyncExternalStore(
    l => (listeners.add(l), () => listeners.delete(l)),
    () => current,
  );
}

export const locale = () => (current === 'de' ? 'de-DE' : 'en-GB');

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  return (current === 'de' ? de : en)[key].replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}
