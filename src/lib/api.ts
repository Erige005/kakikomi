import { Platform } from 'react-native';

import type { Company, Turn } from './store';

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new Error('Không kết nối được máy chủ');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data as T;
}

const post = <T,>(path: string, body: unknown) =>
  call<T>(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const api = {
  correct: (text: string, scope: 'sentence' | 'all', context?: string) =>
    post<{ corrected: string }>('/api/correct', { text, scope, context }),
  prompt: (category: string, recent: string[]) => post<{ question: string }>('/api/prompt', { category, recent }),
  noteQuestions: (note: string) => post<{ questions: string[] }>('/api/note-questions', { note }),
  chain: (turns: Turn[], seed?: string) => post<{ question: string }>('/api/chain', { turns, seed }),
  interview: (body: { cv: string; company?: Partial<Company>; level: string; turns: Turn[] }) =>
    post<{ question: string; deep: boolean }>('/api/interview', body),
  company: (url: string) => post<{ name: string; summary: string; url: string }>('/api/company', { url }),
  photo: () => call<{ url: string; author: string; link: string; source: string }>('/api/photo'),
  transcribe: (wavBase64: string) => post<{ text: string }>('/api/transcribe', { audio: wavBase64 }),
  cv: (asset: { uri: string; name: string; mimeType?: string; file?: File }) => {
    const form = new FormData();
    if (Platform.OS === 'web' && asset.file) form.append('file', asset.file);
    else form.append('file', { uri: asset.uri, name: asset.name, type: asset.mimeType ?? 'application/pdf' } as never);
    return call<{ text: string }>('/api/cv', { method: 'POST', body: form });
  },
};
