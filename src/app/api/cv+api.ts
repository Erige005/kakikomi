import { extractText, getDocumentProxy } from 'unpdf';

import { handle, HttpError } from '@/server/deepseek';

export const POST = handle(async (req) => {
  // React Native's global FormData typing lacks get(); the server runtime has the standard one.
  const form = (await req.formData()) as unknown as { get(name: string): File | string | null };
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'Chưa có file PDF');
  if (file.size > 10 * 1024 * 1024) throw new HttpError(413, 'File quá lớn (tối đa 10MB)');

  const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer())).catch(() => {
    throw new HttpError(400, 'Không đọc được PDF');
  });
  const { text } = await extractText(pdf, { mergePages: true });
  const clean = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) throw new HttpError(422, 'PDF không có chữ (có thể là ảnh scan) — hãy dán text');
  return { text: clean.slice(0, 12000) };
});
