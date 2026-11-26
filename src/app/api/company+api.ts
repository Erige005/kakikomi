import { askJSON, handle, HttpError } from '@/server/deepseek';

const SYSTEM = `Từ nội dung trang chủ một công ty, hãy tóm tắt thông tin hữu ích để luyện phỏng vấn xin việc.
Viết bằng tiếng Việt, ngắn gọn (tối đa ~120 từ): lĩnh vực, sản phẩm/dịch vụ chính, khách hàng, 企業理念/giá trị,
điểm đặc trưng (nếu có tin tuyển dụng IT thì nêu). Không bịa thông tin không có trong trang.
Định dạng: {"name": "<tên công ty>", "summary": "<tóm tắt>"}`;

function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export const POST = handle(async (req) => {
  const { url } = await req.json();
  let target: URL;
  try {
    target = new URL(String(url));
  } catch {
    throw new HttpError(400, 'Link không hợp lệ');
  }
  if (!/^https?:$/.test(target.protocol)) throw new HttpError(400, 'Chỉ nhận link http/https');
  if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.|\[)/i.test(target.hostname)) {
    throw new HttpError(400, 'Link không hợp lệ');
  }

  const res = await fetch(target, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Kakikomi company reader)', 'Accept-Language': 'ja,en;q=0.8' },
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  if (!res || !res.ok) throw new HttpError(502, 'Không đọc được trang này');

  const html = (await res.text()).slice(0, 400000);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? '';
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ?? '';
  const text = htmlToText(html).slice(0, 8000);

  const out = await askJSON<{ name?: string; summary?: string }>(
    SYSTEM,
    `URL: ${target.href}\nTitle: ${title}\nDescription: ${desc}\n\nNội dung:\n${text}`,
    0.3,
  );
  return { name: (out.name || title).trim(), summary: (out.summary || '').trim(), url: target.href };
});
