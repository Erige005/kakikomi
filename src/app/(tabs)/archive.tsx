import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, Chip, Icon, Page, s, T } from '@/components/ui';
import { MODE_LABEL } from '@/constants/modes';
import { C } from '@/constants/theme';
import { bestStreakOf, countChars, dayKey, shortDate, streakOf } from '@/lib/dates';
import { useStore, type Mode } from '@/lib/store';

const FILTERS: { id: 'all' | Mode; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'question', label: 'Câu hỏi' },
  { id: 'diary', label: 'Nhật ký' },
  { id: 'photo', label: 'Ảnh' },
  { id: 'chain', label: 'Chuỗi' },
  { id: 'interview', label: 'Phỏng vấn' },
];
const HEADS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function Archive() {
  const { entries } = useStore();
  const [filter, setFilter] = useState<'all' | Mode>('all');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const times = entries.map((e) => e.createdAt);
  const written = new Set(times.map(dayKey));
  const today = dayKey(new Date());
  const streak = streakOf(times);
  const monthCount = entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  }).length;

  const lead = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  const list = filter === 'all' ? entries : entries.filter((e) => e.mode === filter);

  return (
    <Page
      header={
        <View style={[s.header, { paddingHorizontal: 20, paddingVertical: 12 }]}>
          <T style={{ fontSize: 22, fontWeight: '700', flex: 1 }}>Kho bài</T>
        </View>
      }>
      <Card style={{ gap: 14 }}>
        <View style={[s.row, { justifyContent: 'space-between', alignItems: 'flex-end' }]}>
          <View style={[s.row, { gap: 10 }]}>
            <View style={st.flame}>
              <Icon name="flame" size={24} color={C.flame} />
            </View>
            <View>
              <T style={{ fontSize: 26, fontWeight: '700' }}>{streak} ngày</T>
              <T style={s.small}>liên tiếp · kỷ lục {bestStreakOf(times)}</T>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T style={s.small}>Tháng này</T>
            <T style={{ fontWeight: '700' }}>{monthCount} bài</T>
          </View>
        </View>

        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Tháng trước" onPress={() => shift(-1)} style={st.nav}>
            <Icon name="prev" />
          </Pressable>
          <T style={{ fontWeight: '600' }}>
            Tháng {month.getMonth() + 1}, {month.getFullYear()}
          </T>
          <Pressable accessibilityRole="button" accessibilityLabel="Tháng sau" onPress={() => shift(1)} style={st.nav}>
            <Icon name="next" />
          </Pressable>
        </View>

        <View style={st.cal}>
          {HEADS.map((h) => (
            <View key={h} style={st.cell}>
              <T style={s.small}>{h}</T>
            </View>
          ))}
          {cells.map((n, i) => {
            if (!n) return <View key={`b${i}`} style={st.cell} />;
            const key = dayKey(new Date(month.getFullYear(), month.getMonth(), n));
            const done = written.has(key);
            const isToday = key === today;
            return (
              <View key={key} style={st.cell}>
                <View style={[st.day, done && { backgroundColor: C.shu }, isToday && !done && st.today]}>
                  <T style={{ fontSize: 13, fontWeight: done || isToday ? '700' : '400', color: done ? '#FFFFFF' : isToday ? C.shu : C.muted }}>{n}</T>
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} on={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {list.length === 0 && <T style={{ color: C.muted, textAlign: 'center', marginTop: 16 }}>Chưa có bài nào.</T>}
      {list.map((e) => (
        <Pressable key={e.id} onPress={() => router.push(`/read/${e.id}`)}>
          <Card style={{ gap: 6, paddingVertical: 14 }}>
            <View style={[s.row, { justifyContent: 'space-between' }]}>
              <T style={s.small}>
                {shortDate(e.createdAt)} · {MODE_LABEL[e.mode]}
              </T>
              <T style={s.small}>{e.mode === 'interview' ? `${e.turns?.length ?? 0} câu` : `${countChars(e.text)} 字`}</T>
            </View>
            <T jp numberOfLines={1}>
              {e.text || e.prompt}
            </T>
          </Card>
        </Pressable>
      ))}
    </Page>
  );
}

const st = StyleSheet.create({
  flame: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.shuTint, alignItems: 'center', justifyContent: 'center' },
  nav: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  cal: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 2, borderStyle: 'dashed', borderColor: C.shu },
});
