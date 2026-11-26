import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type Mode = 'question' | 'diary' | 'photo' | 'chain' | 'interview';

export type Turn = { q: string; a: string; deep?: boolean };

export type Entry = {
  id: string;
  mode: Mode;
  prompt: string;
  text: string;
  turns?: Turn[];
  photo?: { url: string; author: string; source: string };
  /** Highlighted phrases (bút dạ); every occurrence in the text is marked. */
  marks?: string[];
  /** Interview only: lets a saved conversation be resumed with the same company and level. */
  companyId?: string;
  level?: string;
  createdAt: number;
  updatedAt: number;
};

export type Note = { id: string; text: string; createdAt: number; usedAt?: number; questions?: string[] };

export type Company = { id: string; name: string; url: string; summary: string; role: string; note: string };

export type Profile = { cvName: string; cvText: string; cvUpdatedAt?: number };

type Data = { entries: Entry[]; notes: Note[]; companies: Company[]; profile: Profile };

const KEY = 'kakikomi:v1';
const EMPTY: Data = { entries: [], notes: [], companies: [], profile: { cvName: '', cvText: '' } };

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function useStoreState() {
  const [data, setData] = useState<Data>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setData({ ...EMPTY, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const patch = (fn: (d: Data) => Partial<Data>) => setData((d) => ({ ...d, ...fn(d) }));

  return {
    ready,
    ...data,
    saveEntry(e: Omit<Entry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
      const now = Date.now();
      const id = e.id ?? uid();
      patch((d) => {
        const old = d.entries.find((x) => x.id === id);
        const next: Entry = { ...old, ...e, id, createdAt: old?.createdAt ?? now, updatedAt: now };
        return { entries: old ? d.entries.map((x) => (x.id === id ? next : x)) : [next, ...d.entries] };
      });
      return id;
    },
    setMarks(id: string, marks: string[]) {
      patch((d) => ({ entries: d.entries.map((x) => (x.id === id ? { ...x, marks } : x)) }));
    },
    deleteEntry(id: string) {
      patch((d) => ({ entries: d.entries.filter((x) => x.id !== id) }));
    },
    addNote(text: string) {
      patch((d) => ({ notes: [{ id: uid(), text, createdAt: Date.now() }, ...d.notes] }));
    },
    updateNote(id: string, p: Partial<Note>) {
      patch((d) => ({ notes: d.notes.map((n) => (n.id === id ? { ...n, ...p } : n)) }));
    },
    deleteNote(id: string) {
      patch((d) => ({ notes: d.notes.filter((n) => n.id !== id) }));
    },
    setProfile(p: Partial<Profile>) {
      patch((d) => ({ profile: { ...d.profile, ...p } }));
    },
    saveCompany(c: Omit<Company, 'id'> & { id?: string }) {
      const id = c.id ?? uid();
      patch((d) => ({ companies: [{ ...c, id }, ...d.companies.filter((x) => x.id !== id)] }));
      return id;
    },
    deleteCompany(id: string) {
      patch((d) => ({ companies: d.companies.filter((x) => x.id !== id) }));
    },
  };
}

type Store = ReturnType<typeof useStoreState>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreState();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
