export const dayKey = (t: number | Date) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** Consecutive days with at least one entry, ending today (or yesterday if today is still empty). */
export function streakOf(times: number[]) {
  const days = new Set(times.map(dayKey));
  const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dayKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function bestStreakOf(times: number[]) {
  const sorted = [...new Set(times.map((t) => new Date(t).setHours(0, 0, 0, 0)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = 0;
  for (const t of sorted) {
    run = prev && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export function shortDate(t: number) {
  const d = new Date(t);
  const today = new Date();
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (dayKey(d) === dayKey(today)) return 'Hôm nay';
  if (dayKey(d) === dayKey(y)) return 'Hôm qua';
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export const countChars = (s: string) => s.replace(/\s/g, '').length;
