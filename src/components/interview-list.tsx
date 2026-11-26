import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { Btn, s, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { shortDate } from '@/lib/dates';
import { useStore } from '@/lib/store';

/** Saved mock interviews, newest activity first, like a chat history. */
export function InterviewList({ activeId, onOpen }: { activeId?: string; onOpen: (id: string) => void }) {
  const store = useStore();
  const chats = store.entries.filter((e) => e.mode === 'interview').sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 6 }}>
      <Btn kind="ai" icon="plus" label="Cuộc phỏng vấn mới" onPress={() => router.push('/interview/setup')} style={{ marginBottom: 8 }} />
      {chats.length === 0 ? <T style={[s.small, { textAlign: 'center', paddingVertical: 16 }]}>Chưa có cuộc phỏng vấn nào</T> : null}
      {chats.map((e) => {
        const turns = e.turns ?? [];
        const answered = turns.filter((t) => t.a).length;
        const last = turns[turns.length - 1];
        const on = e.id === activeId;
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={() => onOpen(e.id)}
            style={({ pressed }) => ({
              padding: 12,
              borderRadius: 12,
              gap: 4,
              backgroundColor: on ? C.aiTint : pressed ? C.sunk : 'transparent',
            })}>
            <T numberOfLines={1} style={{ fontWeight: '600', fontSize: 14, color: on ? C.ai : C.ink }}>
              {e.prompt}
            </T>
            {last ? (
              <T jp numberOfLines={1} style={{ fontSize: 13, color: C.muted }}>
                {last.a || last.q}
              </T>
            ) : null}
            <View style={s.row}>
              <T style={s.small}>
                {shortDate(e.updatedAt)} · {answered} câu
                {last && !last.a ? ' · đang chờ trả lời' : ''}
              </T>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
