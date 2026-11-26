import { askJSON, clip, handle, HttpError } from '@/server/deepseek';

const SYSTEM = `Bạn là giáo viên tiếng Nhật bản xứ. Người học (trình độ N2) đưa một đoạn tiếng Nhật họ tự viết.
Nhiệm vụ: sửa thành tiếng Nhật đúng ngữ pháp VÀ tự nhiên như người Nhật viết.
Quy tắc:
- Giữ nguyên ý, giữ nguyên văn phong người học đang dùng (だ・である / です・ます / văn nói), không đổi sang văn phong khác.
- Người học có thể chen tiếng Việt hoặc tiếng Anh khi chưa biết cách nói (ví dụ "ơn trời!", "deadline"): dịch những chỗ đó sang tiếng Nhật tự nhiên hợp ngữ cảnh. Kết quả KHÔNG được còn chữ tiếng Việt hay câu tiếng Anh (thuật ngữ IT quen dùng ở Nhật thì viết theo cách người Nhật viết, ví dụ katakana).
- Giữ nguyên các chỗ giữ chỗ dạng [....].
- Không thêm ý mới, không giải thích.
- Nếu đã tự nhiên rồi thì trả nguyên văn.
Định dạng: {"corrected": "<văn bản đã sửa>"}`;

export const POST = handle(async (req) => {
  const body = await req.json();
  const text = clip(body.text, 4000).trim();
  if (!text) throw new HttpError(400, 'Chưa có nội dung để sửa');
  const context = clip(body.context, 4000);

  const user =
    body.scope === 'sentence' && context
      ? `Toàn bộ bài (chỉ để hiểu ngữ cảnh, KHÔNG sửa):\n${context}\n\nChỉ sửa câu sau:\n${text}`
      : text;
  const out = await askJSON<{ corrected?: string }>(SYSTEM, user, 0.3);
  return { corrected: (out.corrected || text).trim() };
});
