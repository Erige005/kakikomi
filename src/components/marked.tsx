import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';

import { Btn, Icon, s, T } from '@/components/ui';
import { C, Fonts } from '@/constants/theme';

type Seg = { text: string; marks: string[] };

/** Splits text into plain and highlighted runs; overlapping marks merge into one run. */
function segments(text: string, marks: string[]): Seg[] {
  const hit: string[][] = Array.from({ length: text.length }, () => []);
  for (const m of marks) {
    if (!m) continue;
    for (let i = text.indexOf(m); i !== -1; i = text.indexOf(m, i + m.length)) {
      for (let j = i; j < i + m.length; j++) hit[j].push(m);
    }
  }
  const out: Seg[] = [];
  for (let i = 0; i < text.length; ) {
    const on = hit[i].length > 0;
    const set = new Set<string>();
    let j = i;
    while (j < text.length && hit[j].length > 0 === on) hit[j++].forEach((m) => set.add(m));
    out.push({ text: text.slice(i, j), marks: [...set] });
    i = j;
  }
  return out;
}

/** Text with bút-dạ highlights; tapping a highlight removes it. */
export function Marked({ text, marks, onUnmark, style }: { text: string; marks: string[]; onUnmark: (marks: string[]) => void; style?: StyleProp<TextStyle> }) {
  return (
    <T jp style={style}>
      {segments(text, marks).map((g, i) =>
        g.marks.length ? (
          // Plain Text so the run inherits font size and line height from the paragraph.
          <Text key={i} style={{ backgroundColor: C.marker, color: C.ink }} onPress={() => onUnmark(g.marks)} accessibilityHint="Chạm để bỏ tô">
            {g.text}
          </Text>
        ) : (
          g.text
        ),
      )}
    </T>
  );
}

type MarkableProps = { text: string; marks: string[]; onUnmark: (marks: string[]) => void; onPick: (s: string | null) => void; style?: TextStyle };

/**
 * Highlightable text. On web the normal text selection is read by `usePick`; native Text reports no selection,
 * so a long press swaps in a read-only input whose selection can be read.
 */
export function Markable({ text, marks, onUnmark, onPick, style }: MarkableProps) {
  const [selecting, setSelecting] = useState(false);
  if (Platform.OS === 'web') return <Marked text={text} marks={marks} onUnmark={onUnmark} style={style} />;
  if (selecting) return <SelectInput text={text} style={style} onPick={onPick} onDone={() => setSelecting(false)} />;
  return (
    <Pressable onLongPress={() => setSelecting(true)} accessibilityHint="Giữ lâu để bôi đen và tô">
      <Marked text={text} marks={marks} onUnmark={onUnmark} style={style} />
    </Pressable>
  );
}

function SelectInput({ text, style, onPick, onDone }: { text: string; style?: TextStyle; onPick: (s: string | null) => void; onDone: () => void }) {
  const [height, setHeight] = useState<number | undefined>();
  return (
    <TextInput
      multiline
      autoFocus
      value={text}
      onChangeText={() => {}}
      showSoftInputOnFocus={false}
      scrollEnabled={false}
      // Leaving the input (e.g. tapping "Tô màu") goes back to normal text.
      onBlur={onDone}
      accessibilityLabel="Bôi đen chữ muốn tô"
      onContentSizeChange={(e) => setHeight(e.nativeEvent.contentSize.height)}
      onSelectionChange={(e) => {
        const { start, end } = e.nativeEvent.selection;
        onPick(text.slice(start, end).trim() || null);
      }}
      style={[{ fontSize: 15, color: C.ink }, style, { fontFamily: Fonts.jp, padding: 0, height }]}
    />
  );
}

/** Current text selection to highlight. On web it follows the page selection (outside input boxes). */
export function usePick() {
  const [pick, setPick] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let clear: ReturnType<typeof setTimeout> | undefined;
    const onChange = () => {
      const el = document.activeElement;
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) return;
      const t = window.getSelection()?.toString().trim();
      clearTimeout(clear);
      // Pressing "Tô màu" collapses the selection on mousedown; keep the pick long enough for the click to land.
      if (t) setPick(t);
      else clear = setTimeout(() => setPick(null), 400);
    };
    document.addEventListener('selectionchange', onChange);
    return () => {
      clearTimeout(clear);
      document.removeEventListener('selectionchange', onChange);
    };
  }, []);
  return [pick, setPick] as const;
}

/** Bar that appears while something is selected. */
export function MarkBar({ pick, onMark }: { pick: string | null; onMark: () => void }) {
  if (!pick) return null;
  return (
    <View style={[s.row, { padding: 8, paddingLeft: 14, borderRadius: 12, backgroundColor: C.ink }]}>
      <Icon name="marker" size={16} color={C.marker} />
      <T jp numberOfLines={1} style={{ flex: 1, color: '#FFFFFF', fontSize: 14 }}>
        「{pick}」
      </T>
      <Btn small icon="marker" label="Tô màu" onPress={onMark} />
    </View>
  );
}

/** Adds the picked phrase to an entry's marks. */
export function withMark(marks: string[], pick: string | null) {
  return pick && !marks.includes(pick) ? [...marks, pick] : marks;
}
