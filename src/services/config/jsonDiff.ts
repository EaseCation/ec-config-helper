export type DiffMode = 'add' | 'remove' | 'changed';

export interface KeyedDifferentPart<T = unknown> {
  key: string;
  mode: DiffMode;
  from?: T;
  to?: T;
}

export interface KeyedDiffSummary<T = unknown> {
  isEqual: boolean;
  added: string[];
  removed: string[];
  changed: string[];
  parts: Record<string, KeyedDifferentPart<T>>;
}

export function compareKeyedRecords<T>(
  localItems: Record<string, T> = {},
  remoteItems: Record<string, T> = {}
): KeyedDiffSummary<T> {
  const parts: Record<string, KeyedDifferentPart<T>> = {};

  for (const key of Object.keys(remoteItems)) {
    if (!(key in localItems)) {
      parts[key] = { key, mode: 'add', to: remoteItems[key] };
    } else if (JSON.stringify(localItems[key]) !== JSON.stringify(remoteItems[key])) {
      parts[key] = { key, mode: 'changed', from: localItems[key], to: remoteItems[key] };
    }
  }

  for (const key of Object.keys(localItems)) {
    if (!(key in remoteItems)) {
      parts[key] = { key, mode: 'remove', from: localItems[key] };
    }
  }

  const added = Object.values(parts).filter((part) => part.mode === 'add').map((part) => part.key);
  const removed = Object.values(parts).filter((part) => part.mode === 'remove').map((part) => part.key);
  const changed = Object.values(parts).filter((part) => part.mode === 'changed').map((part) => part.key);

  return {
    isEqual: added.length === 0 && removed.length === 0 && changed.length === 0,
    added,
    removed,
    changed,
    parts,
  };
}
