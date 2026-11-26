const TERM = /[。！？!?\n]/;

/** Bounds [start, end) of the sentence around the cursor. */
export function sentenceAt(text: string, cursor: number): [number, number] {
  if (!text) return [0, 0];
  let pos = Math.min(Math.max(cursor, 0), text.length - 1);
  // Cursor right after a terminator (or at the end) belongs to the sentence before it.
  if (pos > 0 && (cursor >= text.length || TERM.test(text[cursor - 1] ?? ''))) pos = cursor - 1;
  while (pos > 0 && text[pos] === '\n') pos--;

  let start = pos - 1;
  while (start >= 0 && !TERM.test(text[start])) start--;
  start++;

  let end = pos;
  while (end < text.length && !TERM.test(text[end])) end++;
  if (end < text.length && text[end] !== '\n') end++;
  while (end < text.length && /[」』）)]/.test(text[end])) end++;

  while (start < end && /\s/.test(text[start])) start++;
  return [start, end];
}
