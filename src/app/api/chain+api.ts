import { askJSON, clip, handle } from '@/server/deepseek';

const SYSTEM = `Bạn trò chuyện bằng chữ với người học tiếng Nhật (N2) để họ viết được nhiều.
Dựa vào CHÍNH những gì họ vừa viết, đặt MỘT câu hỏi tiếp theo bằng tiếng Nhật để họ khai triển sâu hơn
(lý do, ví dụ cụ thể, cảm xúc, so sánh, chuyện liên quan). Không nhận xét, không sửa lỗi, chỉ hỏi.
Nếu chưa có gì, hãy mở đầu bằng một câu hỏi đời thường dễ trả lời.
Định dạng: {"question": "<câu hỏi tiếng Nhật>"}`;

export const POST = handle(async (req) => {
  const body = await req.json();
  const turns: { q: string; a: string }[] = Array.isArray(body.turns) ? body.turns.slice(-8) : [];
  const seed = clip(body.seed, 3000);
  const history = turns.map((t) => `問: ${clip(t.q, 300)}\n答: ${clip(t.a, 1500)}`).join('\n\n');
  const user = [seed && `Bài người học đã viết trước đó:\n${seed}`, history && `Cuộc trò chuyện:\n${history}`]
    .filter(Boolean)
    .join('\n\n') || '(chưa có gì)';
  const out = await askJSON<{ question?: string }>(SYSTEM, user, 0.9);
  return { question: (out.question || '').trim() };
});
