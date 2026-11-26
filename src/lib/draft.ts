import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Entry } from './store';

export type Draft = { text: string; prompt: string; photo?: Entry['photo'] & { link?: string }; savedAt: number };

const key = (k: string) => `kakikomi:draft:${k}`;

/** Unsaved writing, kept per screen so a reload or going back doesn't lose it. */
export const drafts = {
  async load(k: string): Promise<Draft | null> {
    try {
      const raw = await AsyncStorage.getItem(key(k));
      return raw ? (JSON.parse(raw) as Draft) : null;
    } catch {
      return null;
    }
  },
  save(k: string, d: Omit<Draft, 'savedAt'>) {
    const p = d.text.trim() ? AsyncStorage.setItem(key(k), JSON.stringify({ ...d, savedAt: Date.now() })) : AsyncStorage.removeItem(key(k));
    p.catch(() => {});
  },
  clear(k: string) {
    AsyncStorage.removeItem(key(k)).catch(() => {});
  },
};
