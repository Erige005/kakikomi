import { askJSON, clip, handle } from '@/server/deepseek';

const LEVELS: Record<string, string> = {
  easy: 'thân thiện, nhẹ nhàng, ít hỏi xoáy',
  normal: 'chuyên nghiệp như phỏng vấn thật, hỏi xoáy (深掘り) khi câu trả lời còn mơ hồ',
  hard: 'nghiêm khắc kiểu 圧迫面接: hỏi xoáy liên tục, chỉ ra mâu thuẫn, hỏi "なぜ" nhiều lần (nhưng vẫn lịch sự)',
};

const SYSTEM = (level: string) => `Bạn là 面接官 của một công ty Nhật đang phỏng vấn tuyển dụng 新卒 vị trí IT.
Phong cách: ${LEVELS[level] ?? LEVELS.normal}.
Dùng kính ngữ tự nhiên của người phỏng vấn Nhật. Mỗi lượt chỉ hỏi MỘT câu.
Dựa vào CV, thông tin công ty và câu trả lời trước để hỏi cụ thể (đặc biệt 志望動機 phải gắn với công ty này).
Trình tự gợi ý: 自己紹介 → ガクチカ/dự án → 志望動機 → 長所短所 → kỹ thuật → キャリアプラン → 逆質問.
"deep" = true nếu câu này là hỏi xoáy tiếp câu trả lời trước.
Định dạng: {"question": "<câu hỏi tiếng Nhật>", "deep": true|false}`;

export const POST = handle(async (req) => {
  const body = await req.json();
  const turns: { q: string; a: string }[] = Array.isArray(body.turns) ? body.turns.slice(-12) : [];
  const parts = [
    `CV của ứng viên:\n${clip(body.cv, 6000) || '(không có)'}`,
    `Công ty: ${clip(body.company?.name, 200) || '(chưa rõ)'}\n${clip(body.company?.summary, 3000)}`,
    `Vị trí: ${clip(body.company?.role, 200) || '新卒 ITエンジニア'}`,
    body.company?.note ? `Ghi chú: ${clip(body.company.note, 500)}` : '',
    turns.length
      ? `Diễn biến:\n${turns.map((t) => `面接官: ${clip(t.q, 400)}\n応募者: ${clip(t.a, 1500)}`).join('\n')}`
      : 'Buổi phỏng vấn vừa bắt đầu. Hãy chào ngắn và mời tự giới thiệu.',
  ];
  const out = await askJSON<{ question?: string; deep?: boolean }>(
    SYSTEM(body.level),
    parts.filter(Boolean).join('\n\n'),
    0.8,
  );
  return { question: (out.question || '').trim(), deep: !!out.deep };
});
