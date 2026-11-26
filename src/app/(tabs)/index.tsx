import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Field, Icon, Page, s, T, type IconName } from '@/components/ui';
import { MODE_LABEL } from '@/constants/modes';
import { C, Fonts } from '@/constants/theme';
import { countChars, shortDate, streakOf } from '@/lib/dates';
import { useStore } from '@/lib/store';

type ModeCard = { title: string; desc: string; icon: IconName; go: () => void; wide?: boolean; blue?: boolean };

const MODES: ModeCard[] = [
  { title: 'Câu hỏi gợi ý', desc: 'AI ra đề theo chủ đề, bạn trả lời', icon: 'bubble', go: () => router.push('/write?mode=question') },
  { title: 'Nhật ký', desc: 'Kể lại ngày hôm nay của bạn', icon: 'book', go: () => router.push('/write?mode=diary') },
  { title: 'Mô tả ảnh', desc: 'Ảnh thật ngẫu nhiên, tả lại bằng tiếng Nhật', icon: 'photo', go: () => router.push('/write?mode=photo') },
  { title: 'Viết tiếp chuỗi', desc: 'AI hỏi tiếp từ chính câu bạn vừa viết', icon: 'link', go: () => router.push('/chain') },
  { title: 'Phỏng vấn thử', desc: 'AI làm 面接官, hỏi xoáy theo CV và công ty', icon: 'work', go: () => router.push('/interview'), wide: true, blue: true },
];

export default function Home() {
  const store = useStore();
  const [note, setNote] = useState('');
  const streak = streakOf(store.entries.map((e) => e.createdAt));
  const unused = store.notes.filter((n) => !n.usedAt).length;

  const saveNote = () => {
    const t = note.trim();
    if (!t) return;
    store.addNote(t);
    setNote('');
  };

  return (
    <Page
      header={
        <View style={[s.header, { paddingHorizontal: 20, paddingVertical: 12 }]}>
          <View style={[s.row, { flex: 1, gap: 10 }]}>
            <View style={st.logo}>
              <T jp style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '600' }}>
                書
              </T>
            </View>
            <T style={{ fontSize: 18, fontWeight: '700' }}>Kakikomi</T>
          </View>
          <Link href="/archive" asChild>
            <Pressable accessibilityLabel={`Streak ${streak} ngày`} style={st.streak}>
              <Icon name="flame" size={26} color={streak ? C.flame : C.faint} />
              <T style={{ fontSize: 22, fontWeight: '800', color: streak ? '#D9622B' : C.faint }}>{streak}</T>
            </Pressable>
          </Link>
        </View>
      }>
      <View style={st.noteCard}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={s.row}>
            <Icon name="bulb" color="#FFFFFF" />
            <T style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>Note ý tưởng</T>
          </View>
          <Link href="/notes" asChild>
            <Pressable style={st.notePill}>
              <T style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{unused} chưa dùng</T>
              <Icon name="next" size={14} color="#FFFFFF" />
            </Pressable>
          </Link>
        </View>
        <View style={s.row}>
          <Field
            value={note}
            onChangeText={setNote}
            placeholder="Vừa nghĩ ra gì? Ghi lại ngay…"
            accessibilityLabel="Ghi nhanh ý tưởng"
            onSubmitEditing={saveNote}
            returnKeyType="done"
            style={{ flex: 1, borderWidth: 0 }}
          />
          <Pressable accessibilityRole="button" accessibilityLabel="Lưu note" onPress={saveNote} style={st.noteAdd}>
            <Icon name="plus" color={C.ai} />
          </Pressable>
        </View>
      </View>

      <View style={st.grid}>
        {MODES.map((m) => (
          <Pressable
            key={m.title}
            accessibilityRole="button"
            onPress={m.go}
            style={({ pressed }) => [st.mode, m.wide && st.modeWide, pressed && { borderColor: C.shu }]}>
            <View style={[st.modeIcon, { backgroundColor: m.blue ? C.aiTint : C.shuTint }]}>
              <Icon name={m.icon} color={m.blue ? C.ai : C.shu} />
            </View>
            <View style={{ gap: 4, flex: m.wide ? 1 : undefined }}>
              <T style={{ fontWeight: '600' }}>{m.title}</T>
              <T style={{ fontSize: 13, color: C.muted, lineHeight: 19 }}>{m.desc}</T>
            </View>
          </Pressable>
        ))}
      </View>

      {store.entries.length > 0 && (
        <View style={{ gap: 10 }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <T style={{ fontSize: 16, fontWeight: '600' }}>Bài gần đây</T>
            <Link href="/archive">
              <T style={{ color: C.shu, fontSize: 14, fontWeight: '500' }}>Xem kho bài</T>
            </Link>
          </View>
          {store.entries.slice(0, 2).map((e) => (
            <Pressable key={e.id} onPress={() => router.push(`/read/${e.id}`)}>
              <Card style={{ gap: 6, paddingVertical: 14 }}>
                <T style={s.small}>
                  {shortDate(e.createdAt)} · {MODE_LABEL[e.mode]} · {countChars(e.text)} 字
                </T>
                <T jp numberOfLines={1} style={{ fontFamily: Fonts.jp }}>
                  {e.text}
                </T>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Page>
  );
}

const st = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 44, paddingHorizontal: 6 },
  logo: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.shu, alignItems: 'center', justifyContent: 'center' },
  noteCard: { backgroundColor: C.ai, borderRadius: 16, padding: 16, gap: 12 },
  notePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  noteAdd: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mode: {
    flexBasis: '46%',
    flexGrow: 1,
    minHeight: 132,
    padding: 16,
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 14,
  },
  modeWide: { flexBasis: '100%', minHeight: 0, flexDirection: 'row', alignItems: 'center', gap: 14 },
  modeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
