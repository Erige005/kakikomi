import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';

import { EditAnswer } from '@/components/edit-answer';
import { MarkBar, Markable, usePick, withMark } from '@/components/marked';
import { InterviewList } from '@/components/interview-list';
import { MicButton, type MicHandle } from '@/components/mic';
import { Btn, ErrorText, Field, Header, Icon, Page, s, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { api } from '@/lib/api';
import { uid, useStore, type Turn } from '@/lib/store';
import { useSpeaker } from '@/lib/tts';

type Msg = Turn & { orig?: string };

export default function InterviewScreen() {
  const params = useLocalSearchParams<{ companyId?: string; level?: string; entryId?: string }>();
  const store = useStore();
  const { width } = useWindowDimensions();
  // Fixed for this screen instance: the URL gains an entryId after the first answer, which must not remount the chat.
  const [key] = useState(() => params.entryId ?? uid());

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: C.ground }}>
      {width >= 960 ? (
        <View style={{ width: 290, borderRightWidth: 1, borderRightColor: C.line, backgroundColor: C.soft }}>
          <InterviewList activeId={params.entryId} onOpen={(id) => router.replace({ pathname: '/interview/session', params: { entryId: id } })} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>{store.ready ? <Session key={key} {...params} /> : null}</View>
    </View>
  );
}

function Session(props: { companyId?: string; level?: string; entryId?: string }) {
  const store = useStore();
  const saved = props.entryId ? store.entries.find((e) => e.id === props.entryId) : undefined;
  const companyId = saved?.companyId ?? props.companyId;
  const level = saved?.level ?? props.level;
  const company = store.companies.find((c) => c.id === companyId);
  const [msgs, setMsgs] = useState<Msg[]>(() => saved?.turns ?? []);
  const [input, setInput] = useState('');
  const spokenBase = useRef('');
  const mic = useRef<MicHandle>(null);
  // Finish any running dictation first so its last words are included and nothing streams in afterwards.
  const takeInput = async () => (mic.current?.isRecording() ? spokenBase.current + (await mic.current.stop()) : input);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const speaker = useSpeaker();
  const [marks, setMarks] = useState<string[]>(() => saved?.marks ?? []);
  const [pick, setPick] = usePick();
  const unmark = (ms: string[]) => setMarks(marks.filter((m) => !ms.includes(m)));

  // Saved after every answer (pending question included), so the conversation can be reopened and continued anytime.
  const entryId = useRef<string | undefined>(saved?.id);
  const persist = (all: Msg[]) => {
    if (!all.some((m) => m.a)) return entryId.current;
    const isNew = !entryId.current;
    entryId.current = store.saveEntry({
      id: entryId.current,
      mode: 'interview',
      prompt: saved?.prompt ?? (company?.name ? `${company.name} · ${company.role}` : 'Phỏng vấn thử'),
      text: all
        .filter((m) => m.a)
        .map((m) => m.a)
        .join('\n\n'),
      turns: all.map(({ q, a, deep }) => ({ q, a, deep })),
      companyId,
      level,
      marks,
    });
    if (isNew) router.setParams({ entryId: entryId.current });
    return entryId.current;
  };
  useEffect(() => {
    persist(msgs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, marks]);

  const ask = async (answered: Msg[]) => {
    setBusy('ask');
    setError(null);
    try {
      const { question, deep } = await api.interview({
        cv: store.profile.cvText,
        company,
        level: level || 'normal',
        turns: answered.map(({ q, a }) => ({ q, a })),
      });
      setMsgs([...answered, { q: question, a: '', deep }]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    // Deferred so the first request doesn't set state inside the effect body (and runs once under StrictMode).
    if (saved) return;
    const t = setTimeout(() => ask([]), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last = msgs[msgs.length - 1];
  const waiting = last && !last.a;

  const send = async () => {
    const a = (await takeInput()).trim();
    if (!a || !waiting) return;
    const answered = msgs.map((m, i) => (i === msgs.length - 1 ? { ...m, a } : m));
    setMsgs(answered);
    setInput('');
    ask(answered);
  };

  const fix = async (i: number) => {
    const m = msgs[i];
    if (m.orig) {
      setMsgs(msgs.map((x, j) => (j === i ? { ...x, a: m.orig!, orig: undefined } : x)));
      return;
    }
    setBusy(`fix${i}`);
    setError(null);
    try {
      const { corrected } = await api.correct(m.a, 'all');
      setMsgs(msgs.map((x, j) => (j === i ? { ...x, a: corrected, orig: m.a } : x)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const finish = async () => {
    // An answer typed but not yet sent is kept too.
    const a = (await takeInput()).trim();
    const id = persist(a && waiting ? msgs.map((m, i) => (i === msgs.length - 1 ? { ...m, a } : m)) : msgs);
    if (!id) return router.back();
    router.replace(`/read/${id}`);
  };

  const answeredCount = msgs.filter((m) => m.a).length;

  return (
    <Page
      header={
        <View style={{ backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.line }}>
          <Header
            title="Phỏng vấn thử"
            sub={`Câu ${answeredCount + 1} · ${company?.name || 'Công ty chưa rõ'}`}
            right={<Btn kind="ghost" small label="Kết thúc" onPress={finish} style={{ marginRight: 4 }} />}
          />
        </View>
      }
      footer={
        <View style={{ gap: 10 }}>
          <MarkBar
            pick={pick}
            onMark={() => {
              setMarks(withMark(marks, pick));
              setPick(null);
            }}
          />
          <View style={[s.row, { alignItems: 'flex-end' }]}>
            <Field
              jp
              multiline
              value={input}
              onChangeText={setInput}
              placeholder="回答を入力…"
              accessibilityLabel="Câu trả lời"
              style={{ flex: 1, minHeight: 72, maxHeight: 180, backgroundColor: C.soft, lineHeight: 26 }}
            />
            <MicButton ref={mic} size={52} onStart={() => (spokenBase.current = input)} onText={(t) => setInput(spokenBase.current + t)} onError={setError} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gửi câu trả lời"
              onPress={send}
              disabled={!input.trim() || !waiting}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: C.ai,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !input.trim() || !waiting ? 0.45 : 1,
              }}>
              <Icon name="send" color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      }>
      <View style={{ height: 8 }} />
      {msgs.map((m, i) => (
        <View key={i} style={{ gap: 14 }}>
          <View style={{ maxWidth: '90%', gap: 6 }}>
            <View style={s.row}>
              <T jp style={{ fontSize: 12, fontWeight: '600', color: C.ai }}>
                面接官
              </T>
              {m.deep ? (
                <View style={{ backgroundColor: C.aiTint, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <T style={{ fontSize: 11, fontWeight: '600', color: C.ai }}>Hỏi xoáy</T>
                </View>
              ) : null}
            </View>
            <View style={[s.row, { alignItems: 'flex-start' }]}>
              <View style={{ flexShrink: 1, padding: 12, paddingHorizontal: 14, borderRadius: 14, borderTopLeftRadius: 4, backgroundColor: C.ai }}>
                <Markable text={m.q} marks={marks} onUnmark={unmark} onPick={setPick} style={{ color: '#FFFFFF', lineHeight: 26 }} />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Nghe câu hỏi"
                onPress={() => speaker.speak(m.q, 0.9)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: C.line,
                  backgroundColor: C.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Icon name="speaker" size={15} color={C.ai} />
              </Pressable>
            </View>
          </View>
          {m.a && editing === i ? (
            <View style={{ alignSelf: 'stretch', marginLeft: '10%' }}>
              <EditAnswer
                value={m.a}
                note={msgs.length - i > 2 ? `AI sẽ đọc lại và hỏi tiếp từ đây; ${msgs.length - i - 1} câu phía sau bị xoá` : 'AI sẽ đọc lại và hỏi câu mới'}
                onCancel={() => setEditing(null)}
                onSave={(a) => {
                  // Like editing a chat message: everything after this answer is dropped and the interviewer asks again.
                  // A manual edit is the new baseline, so the AI-fix undo no longer applies.
                  const next = [...msgs.slice(0, i), { ...m, a, orig: undefined }];
                  setMsgs(next);
                  setEditing(null);
                  ask(next);
                }}
              />
            </View>
          ) : m.a ? (
            <View style={{ alignSelf: 'flex-end', maxWidth: '90%', alignItems: 'flex-end', gap: 6 }}>
              <View
                style={{
                  padding: 12,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  borderTopRightRadius: 4,
                  borderWidth: 1,
                  borderColor: m.orig ? C.shu : C.line,
                  backgroundColor: m.orig ? C.shuWash : C.surface,
                }}>
                <Markable text={m.a} marks={marks} onUnmark={unmark} onPick={setPick} style={{ lineHeight: 26 }} />
              </View>
              <View style={s.row}>
                <Btn kind="ghost" small label="Tự sửa" disabled={busy === 'ask'} onPress={() => setEditing(i)} />
                <Btn kind="ghost" small label={m.orig ? 'AI đã sửa · Hoàn tác' : 'AI sửa'} loading={busy === `fix${i}`} onPress={() => fix(i)} />
              </View>
            </View>
          ) : null}
        </View>
      ))}
      {busy === 'ask' ? <T style={{ color: C.muted }}>面接官が考えています…</T> : null}
      <ErrorText text={error} />
      {error && !waiting ? <Btn kind="ghost" small label="Thử lại" onPress={() => ask(msgs.filter((m) => m.a))} style={{ alignSelf: 'flex-start' }} /> : null}
      {!error && !waiting && !busy && msgs.length ? (
        <Btn kind="ai" icon="bubble" label="Hỏi tiếp" onPress={() => ask(msgs.filter((m) => m.a))} style={{ alignSelf: 'flex-start' }} />
      ) : null}
    </Page>
  );
}
