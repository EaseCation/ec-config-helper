export function parseLanguageConfig(data: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(data)) return map;
  for (const item of data) {
    if (item && typeof item === 'object') {
      const key = String((item as any).key || '');
      const zh = (item as any).zh || (item as any).zh_TW || (item as any).en;
      if (key && typeof zh === 'string') {
        map[key] = zh;
      }
    }
  }
  return map;
}

export function parseKillerMerchandise(data: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!data || typeof data !== 'object') return map;
  for (const value of Object.values<any>(data)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === 'object') {
          const key = String((item as any).merchandise || '');
          const name = String((item as any).name || '');
          if (key && name) {
            map[key] = name;
          }
        }
      }
    }
  }
  return map;
}
