// Server-only: imported from +api.ts routes, never from screens.

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

export async function askJSON<T>(system: string, user: string, temperature = 0.7): Promise<T> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new HttpError(500, 'Thiếu DEEPSEEK_API_KEY trên server');

  const messages: Msg[] = [
    { role: 'system', content: system + '\n\nTrả lời DUY NHẤT bằng một object JSON hợp lệ.' },
    { role: 'user', content: user },
  ];
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
      messages,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new HttpError(502, `DeepSeek lỗi ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new HttpError(502, 'DeepSeek trả về không phải JSON');
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function handle(fn: (req: Request) => Promise<unknown>) {
  return async (req: Request) => {
    try {
      return Response.json(await fn(req));
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      const message = e instanceof Error ? e.message : 'Lỗi không xác định';
      return Response.json({ error: message }, { status });
    }
  };
}

export function clip(s: unknown, max: number): string {
  return typeof s === 'string' ? s.slice(0, max) : '';
}
