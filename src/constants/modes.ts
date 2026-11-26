import type { IconName } from '@/components/ui';
import type { Mode } from '@/lib/store';

export const MODE_LABEL: Record<Mode, string> = {
  question: 'Câu hỏi gợi ý',
  diary: 'Nhật ký',
  photo: 'Mô tả ảnh',
  chain: 'Viết tiếp chuỗi',
  interview: 'Phỏng vấn thử',
};

export const MODE_ICON: Record<Mode, IconName> = {
  question: 'bubble',
  diary: 'book',
  photo: 'photo',
  chain: 'link',
  interview: 'work',
};

export const CATEGORIES = [
  { id: 'life', label: 'Đời sống' },
  { id: 'opinion', label: 'Ý kiến' },
  { id: 'whatif', label: 'Giả định' },
  { id: 'hobby', label: 'Sở thích' },
  { id: 'interview', label: 'Phỏng vấn' },
] as const;

export const DIARY_PROMPT = '今日はどんな一日でしたか。いちばん印象に残ったこと、そのときの気持ち、明日やりたいことを書いてみましょう。';

export const PHOTO_GUIDES = ['Ở đâu?', 'Ai, đang làm gì?', 'Trước đó / sau đó?', 'Cảm giác của bạn'];
