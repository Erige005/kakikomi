import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { EditAnswer } from '@/components/edit-answer';
import { MarkBar, Markable, usePick, withMark } from '@/components/marked';
import { MicButton, type MicHandle } from '@/components/mic';
import { Btn, Card, ErrorText, Field, Header, Page, s, T, Toast } from '@/components/ui';
import { C } from '@/constants/theme';
import { api } from '@/lib/api';
import { countChars } from '@/lib/dates';
import { useStore, type Turn } from '@/lib/store';

export default function Chain() {
  const { seedId } = useLocalSearchParams<{ seedId?: string }>();
  const store = useStore();
  const seed = seedId ? store.entries.find((e) => e.id === seedId) : undefined;

  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState('');
  const [input, setInput] = useState('');
  const spokenBase = useRef('');
  const mic = useRef<MicHandle>(null);
  // Finish any running dictation first so its last words are included and nothing streams in afterwards.
  const takeInput = async () => (mic.current?.isRecording() ? spokenBase.current + (await mic.current.stop()) : input);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ i: number; a: string } | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [marks, setMarks] = useState<string[]>([]);
  const [pick, setPick] = usePick();
  const hl = { marks, onPick: setPick, onUnmark: (ms: string[]) => setMarks(marks.filter((m) => !ms.includes(m))) };

  // Saved after every answer, so leaving the screen or reloading never loses the conversation.
  const entryId = useRef<string | undefined>(undefined);
  const persist = (all: Turn[]) => {
    if (!all.length) return entryId.current;
    entryId.current = store.saveEntry({ id: entryId.current, mode: 'chain', prompt: all[0].q, text: all.map((t) => t.a).join('\n\n'), turns: all, marks });
    return entryId.current;
  };
  useEffect(() => {
    persist(turns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns, marks]);

  const ask = async (next: Turn[]) => {
    setBusy('ask');
    setError(null);
    try {
      const { question } = await api.chain(next, seed?.text);
      setQuestion(question);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    // Deferred so the first request doesn't set state inside the effect body (and runs once under StrictMode).
    const t = setTimeout(() => ask([]), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    const a = (await takeInput()).trim();
    if (!a || !question) return;
    const next = [...turns, { q: question, a }];
    setTurns(next);
    setInput('');
    setQuestion('');
    setUndo(null);
    ask(next);
  };

  const fix = async (i: number) => {
    setBusy(`fix${i}`);
    setError(null);
    try {
      const { corrected } = await api.correct(turns[i].a, 'all');
      setUndo({ i, a: turns[i].a });
      setTurns(turns.map((t, j) => (j === i ? { ...t, a: corrected } : t)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    const last = (await takeInput()).trim();
    const all = last && question ? [...turns, { q: question, a: last }] : turns;
    if (!all.length) return setError('Chưa trả lời câu nào');
    router.replace(`/read/${persist(all)}`);
  };

  const total = countChars(turns.map((t) => t.a).join(''));

  return (
    <Page
      header={<Header title="Viết tiếp chuỗi" right={<T style={[s.small, { marginRight: 8 }]}>Lượt {turns.length + 1} · {total} 字</T>} />}
      footer={
        <View style={{ gap: 10 }}>
          <MarkBar
            pick={pick}
            onMark={() => {
              setMarks(withMark(marks, pick));
              setPick(null);
            }}
          />
          <Field jp multiline value={input} onChangeText={setInput} placeholder="Viết tiếp bằng tiếng Nhật…" accessibilityLabel="Câu trả lời tiếp theo" style={{ minHeight: 88, maxHeight: 180, backgroundColor: C.soft, lineHeight: 26 }} />
          <View style={s.row}>
            <MicButton ref={mic} onStart={() => (spokenBase.current = input)} onText={(t) => setInput(spokenBase.current + t)} onError={setError} />
            <Btn kind="outline" label="Kết thúc" style={{ flex: 1 }} onPress={finish} />
            <Btn icon="send" label="Gửi, hỏi tiếp" style={{ flex: 1 }} onPress={send} disabled={!input.trim() || !question} />
          </View>
        </View>
      }>
      {seed ? (
        <Card style={{ backgroundColor: C.soft }}>
          <T style={s.small}>Tiếp nối bài trước</T>
          <T jp numberOfLines={3} style={{ color: C.muted, lineHeight: 24 }}>
            {seed.text}
          </T>
        </Card>
      ) : null}

      {turns.map((t, i) => (
        <View key={i} style={{ gap: 8 }}>
          <Q text={t.q} hl={hl} />
          <Card style={{ marginLeft: 38, padding: 12, gap: 8, ...(undo?.i === i ? { borderColor: C.shu, backgroundColor: C.shuWash } : null) }}>
            {editing === i ? (
              <EditAnswer
                value={t.a}
                note={turns.length - i > 1 ? `AI sẽ đọc lại và hỏi tiếp từ đây; ${turns.length - i - 1} lượt phía sau bị xoá` : 'AI sẽ đọc lại và hỏi câu mới'}
                onCancel={() => setEditing(null)}
                onSave={(a) => {
                  // Like editing a chat message: later turns are dropped and the next question is asked again.
                  const next = [...turns.slice(0, i), { ...t, a }];
                  setTurns(next);
                  setQuestion('');
                  setUndo(null);
                  setEditing(null);
                  ask(next);
                }}
              />
            ) : (
              <Markable text={t.a} {...hl} style={{ lineHeight: 28 }} />
            )}
            {editing === i ? null : undo?.i === i ? (
              <Toast
                text="Đã sửa"
                action="Hoàn tác"
                onAction={() => {
                  setTurns(turns.map((x, j) => (j === i ? { ...x, a: undo.a } : x)));
                  setUndo(null);
                }}
              />
            ) : (
              <View style={[s.row, { justifyContent: 'flex-end' }]}>
                <Btn kind="ghost" small label="Tự sửa" disabled={busy === 'ask'} onPress={() => setEditing(i)} />
                <Btn kind="ghost" small label="AI sửa" loading={busy === `fix${i}`} onPress={() => fix(i)} />
              </View>
            )}
          </Card>
        </View>
      ))}

      {question ? <Q text={question} current hl={hl} /> : busy === 'ask' ? <T style={{ color: C.muted }}>Đang nghĩ câu hỏi…</T> : null}
      <ErrorText text={error} />
      {error && !question ? <Btn kind="ghost" small label="Thử lại" onPress={() => ask(turns)} style={{ alignSelf: 'flex-start' }} /> : null}
    </Page>
  );
}

type Hl = { marks: string[]; onPick: (s: string | null) => void; onUnmark: (ms: string[]) => void };

function Q({ text, current, hl }: { text: string; current?: boolean; hl: Hl }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: current ? C.ai : C.aiTint, alignItems: 'center', justifyContent: 'center' }}>
        <T jp style={{ fontSize: 13, fontWeight: '600', color: current ? '#FFFFFF' : C.ai }}>
          問
        </T>
      </View>
      <View style={{ flex: 1, paddingTop: 2 }}>
        <Markable text={text} {...hl} style={{ color: C.ai, fontWeight: '600', fontSize: current ? 16 : 15, lineHeight: 26 }} />
      </View>
    </View>
  );
}
