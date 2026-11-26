import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Btn, Card, Chip, ErrorText, Field, Icon, Label, Page, s, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { api } from '@/lib/api';
import { shortDate } from '@/lib/dates';
import { useStore, type Note } from '@/lib/store';

export default function Notes() {
  const store = useStore();
  const [text, setText] = useState('');
  const [tab, setTab] = useState<'new' | 'used'>('new');

  const unused = store.notes.filter((n) => !n.usedAt);
  const used = store.notes.filter((n) => n.usedAt);
  const list = tab === 'new' ? unused : used;

  const add = () => {
    const t = text.trim();
    if (!t) return;
    store.addNote(t);
    setText('');
  };

  return (
    <Page
      header={
        <View style={[s.header, { paddingHorizontal: 20, paddingVertical: 12 }]}>
          <T style={{ fontSize: 22, fontWeight: '700', flex: 1 }}>Note ý tưởng</T>
        </View>
      }>
      <View style={s.row}>
        <Field
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Nghĩ ra gì thì ghi lại, tiếng Việt hay Nhật đều được…"
          accessibilityLabel="Ghi nhanh ý tưởng"
          style={{ flex: 1, minHeight: 64 }}
        />
        <Pressable accessibilityRole="button" accessibilityLabel="Lưu note" onPress={add} style={{ width: 56, alignSelf: 'stretch', borderRadius: 12, backgroundColor: C.ai, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={s.row}>
        <Chip label={`Chưa dùng · ${unused.length}`} on={tab === 'new'} onPress={() => setTab('new')} />
        <Chip label={`Đã viết · ${used.length}`} on={tab === 'used'} onPress={() => setTab('used')} />
      </View>

      {list.length === 0 && (
        <T style={{ color: C.muted, textAlign: 'center', marginTop: 24 }}>
          {tab === 'new' ? 'Chưa có note nào. Gặp gì hay thì ghi lại nhé.' : 'Chưa viết từ note nào.'}
        </T>
      )}
      {list.map((n) => (
        <NoteCard key={n.id} note={n} />
      ))}
    </Page>
  );
}

function NoteCard({ note }: { note: Note }) {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gen = async () => {
    setLoading(true);
    setError(null);
    try {
      const { questions } = await api.noteQuestions(note.text);
      store.updateNote(note.id, { questions });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const write = (q: string) => router.push({ pathname: '/write', params: { mode: 'question', prompt: q, noteId: note.id } });

  return (
    <Card style={note.questions?.length ? { borderColor: C.ai } : null}>
      <View style={[s.row, { justifyContent: 'space-between' }]}>
        <T style={s.small}>{shortDate(note.createdAt)}</T>
        <Pressable accessibilityRole="button" accessibilityLabel="Xoá note" hitSlop={8} onPress={() => store.deleteNote(note.id)}>
          <Icon name="trash" size={16} color={C.muted} />
        </Pressable>
      </View>
      <T style={{ lineHeight: 22 }}>{note.text}</T>
      {note.questions?.length ? (
        <View style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EFEAE0' }}>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Label color={C.ai}>AI GỢI Ý {note.questions.length} CÂU HỎI</Label>
            <Pressable accessibilityRole="button" accessibilityLabel="Tạo câu hỏi khác" hitSlop={8} onPress={gen}>
              <Icon name="refresh" size={16} color={C.ai} />
            </Pressable>
          </View>
          {note.questions.map((q) => (
            <Pressable key={q} accessibilityRole="button" onPress={() => write(q)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, padding: 10, borderRadius: 10, backgroundColor: C.aiWash }}>
              <T jp style={{ flex: 1, fontSize: 14, lineHeight: 22 }}>
                {q}
              </T>
              <T style={{ color: C.ai, fontSize: 13, fontWeight: '600' }}>Viết</T>
            </Pressable>
          ))}
        </View>
      ) : (
        <Btn kind="ghost" small icon="bulb" label="Biến thành câu hỏi" loading={loading} onPress={gen} style={{ alignSelf: 'flex-start' }} />
      )}
      <ErrorText text={error} />
    </Card>
  );
}
