import { askJSON, clip, handle, HttpError } from '@/server/deepseek';

const SYSTEM = `Người học tiếng Nhật (N2) ghi lại một ý tưởng thoáng qua trong ngày (tiếng Việt hoặc tiếng Nhật).
Hãy biến nó thành 3 câu hỏi tiếng Nhật khác góc nhìn nhau để họ khai triển thành bài viết:
1) miêu tả / kể lại, 2) liên hệ bản thân, 3) suy nghĩ / tưởng tượng rộng ra.
Mỗi câu hỏi ngắn gọn, tự nhiên.
Định dạng: {"questions": ["...", "...", "..."]}`;

export const POST = handle(async (req) => {
  const body = await req.json();
  const note = clip(body.note, 1000).trim();
  if (!note) throw new HttpError(400, 'Note trống');
  const out = await askJSON<{ questions?: string[] }>(SYSTEM, note, 0.9);
  return { questions: (out.questions || []).filter((q) => typeof q === 'string').slice(0, 3) };
});
