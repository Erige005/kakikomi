import { askJSON, clip, handle } from '@/server/deepseek';

const TOPICS: Record<string, string> = {
  life: 'đời sống cá nhân: thói quen, kỷ niệm, kế hoạch, cảm xúc, chuyện hằng ngày',
  opinion: 'nêu ý kiến (意見文): một vấn đề xã hội/đời sống để người học đồng ý hay phản đối và lập luận',
  whatif: 'giả định / tưởng tượng: "nếu…thì sao", tình huống viễn tưởng, viết truyện ngắn',
  hobby: 'sở thích: anime, game, visual novel, âm nhạc, phim, sách — review, kể lại, giới thiệu cho người khác',
  interview: 'câu hỏi phỏng vấn xin việc IT ở Nhật cho sinh viên sắp ra trường (自己紹介, 志望動機, ガクチカ, 長所短所, kỹ thuật, tương lai)',
};

const SYSTEM = `Bạn ra đề luyện viết tiếng Nhật cho người học trình độ N2.
Viết MỘT câu hỏi bằng tiếng Nhật tự nhiên, cụ thể, gợi được 5–10 câu trả lời (không hỏi chung chung kiểu "趣味は何ですか").
Có thể kèm một câu phụ gợi hướng ("どうしてですか" / "具体的に教えてください").
Định dạng: {"question": "<câu hỏi tiếng Nhật>"}`;

export const POST = handle(async (req) => {
  const body = await req.json();
  const topic = TOPICS[body.category] ?? TOPICS.life;
  const avoid = Array.isArray(body.recent) ? body.recent.map((s: unknown) => clip(s, 200)).slice(0, 15) : [];
  const user = `Chủ đề: ${topic}.${avoid.length ? `\nĐừng lặp lại các đề đã ra:\n- ${avoid.join('\n- ')}` : ''}`;
  const out = await askJSON<{ question?: string }>(SYSTEM, user, 1.1);
  return { question: (out.question || '').trim() };
});
