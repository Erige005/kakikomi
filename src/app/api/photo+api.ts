import { handle } from '@/server/deepseek';

const QUERIES = ['japan street', 'people city', 'cafe', 'train station', 'market', 'park', 'kitchen', 'festival', 'office', 'rain'];

export const GET = handle(async () => {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (key) {
    const query = QUERIES[Math.floor(Math.random() * QUERIES.length)];
    const res = await fetch(
      `https://api.unsplash.com/photos/random?orientation=landscape&content_filter=high&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } },
    );
    if (res.ok) {
      const p = await res.json();
      return {
        url: p.urls?.regular as string,
        author: p.user?.name as string,
        link: `${p.links?.html}?utm_source=kakikomi&utm_medium=referral`,
        source: 'Unsplash',
      };
    }
  }
  // Fallback without a key: Lorem Picsum random photo.
  const id = Math.floor(Math.random() * 1000);
  return { url: `https://picsum.photos/seed/${id}/1080/720`, author: '', link: 'https://picsum.photos', source: 'Picsum' };
});
