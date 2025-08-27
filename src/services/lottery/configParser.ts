import { WikiResult } from './lotteryService';

/**
 * Parse local lottery configuration JSON into WikiResult map
 */
export function parseLocalLotteryConfig(data: any): Record<string, WikiResult> {
  const map: Record<string, WikiResult> = {};
  if (!data || typeof data !== 'object') return map;

  for (const [exc, cfg] of Object.entries<any>(data)) {
    const wiki: WikiResult = {
      name: exc,
      exc,
      display: true,
      fallbackTimes: Number((cfg as any).fallbackTimes) || 0,
      gain: []
    };

    const gains = Array.isArray((cfg as any).gain) ? (cfg as any).gain : [];
    for (const g of gains) {
      const weight = Number((g as any).weight) || 0;
      if ((g as any).subExchanges || (g as any).exc) {
        const sub = (g as any).subExchanges || (g as any).exc;
        wiki.gain.push({ weight, exc: String(sub), fallback: Boolean((g as any).fallback) });
      } else if ((g as any).merchandises && (g as any).merchandises.length > 0) {
        const merch = String((g as any).merchandises[0]);
        const [name, value] = merch.split(':');
        const dataNum = Number(value);
        wiki.gain.push({ weight, name, data: isNaN(dataNum) ? 0 : dataNum });
      } else if ((g as any).coin !== undefined) {
        wiki.gain.push({ weight, name: 'coin', data: Number((g as any).coin) });
      } else if ((g as any).exp !== undefined) {
        wiki.gain.push({ weight, name: 'exp', data: Number((g as any).exp) });
      }
    }

    map[exc] = wiki;
  }

  return map;
}
