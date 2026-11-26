import { handle, HttpError } from '@/server/deepseek';

// Whisper sometimes "hears" these on silence or noise.
const HALLUCINATIONS = [/ご視聴ありがとうございました。?/g, /チャンネル登録.*?お願いします。?/g];

export const POST = handle(async (req) => {
  const { audio } = await req.json();
  if (typeof audio !== 'string' || !audio) throw new HttpError(400, 'Chưa có ghi âm');
  if (audio.length > 8 * 1024 * 1024) throw new HttpError(413, 'Ghi âm quá dài');
  const bin = atob(audio);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const file = new Blob([bytes], { type: 'audio/wav' });

  // Local whisper.cpp server (needs WAV); swap for a cloud Whisper endpoint later.
  const url = process.env.WHISPER_URL || 'http://127.0.0.1:8081/inference';
  const out = new FormData();
  out.append('file', file, 'audio.wav');
  out.append('language', 'ja');
  out.append('response_format', 'json');

  const res = await fetch(url, { method: 'POST', body: out }).catch(() => null);
  if (!res) throw new HttpError(503, 'Không kết nối được Whisper trên Mac (cổng 8081)');
  if (!res.ok) throw new HttpError(502, `Whisper lỗi: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();

  let text: string = (data.text ?? '').replace(/\s*\n\s*/g, '');
  for (const re of HALLUCINATIONS) text = text.replace(re, '');
  return { text: text.trim() };
});
