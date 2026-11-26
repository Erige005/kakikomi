import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { MicButton, type MicHandle } from '@/components/mic';
import { Btn, Card, Chip, ErrorText, Field, Header, Icon, Label, Page, s, T, Toast } from '@/components/ui';
import { CATEGORIES, DIARY_PROMPT, MODE_LABEL, PHOTO_GUIDES } from '@/constants/modes';
import { C } from '@/constants/theme';
import { api } from '@/lib/api';
import { countChars } from '@/lib/dates';
import { drafts } from '@/lib/draft';
import { sentenceAt } from '@/lib/sentence';
import { useStore, type Entry } from '@/lib/store';
import { useSpeaker } from '@/lib/tts';

type Params = { mode?: string; prompt?: string; noteId?: string; id?: string };
type Photo = NonNullable<Entry['photo']> & { link?: string };

export default function Write() {
  const params = useLocalSearchParams<Params>();
  const store = useStore();
  const existing = params.id ? store.entries.find((e) => e.id === params.id) : undefined;
  const mode = (existing?.mode ?? params.mode ?? 'question') as 'question' | 'diary' | 'photo';

  const [category, setCategory] = useState<string>('life');
  const [prompt, setPrompt] = useState(existing?.prompt ?? params.prompt ?? (mode === 'diary' ? DIARY_PROMPT : ''));
  const [photo, setPhoto] = useState<Photo | undefined>(existing?.photo);
  const [text, setText] = useState(existing?.text ?? '');
  const sel = useRef({ start: 0, end: 0 });
  const [undo, setUndo] = useState<{ text: string; msg: string } | null>(null);
  const [busy, setBusy] = useState<'prompt' | 'sentence' | 'all' | 'photo' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const speaker = useSpeaker();

  const recentPrompts = store.entries.filter((e) => e.mode === 'question').slice(0, 15).map((e) => e.prompt);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const newPrompt = (cat = category) =>
    run('prompt', async () => {
      const { question } = await api.prompt(cat, recentPrompts);
      setPrompt(question);
    });

  const newPhoto = () =>
    run('photo', async () => {
      setPhoto(await api.photo());
    });

  // Unsaved text is autosaved per screen and restored on return, so a reload or going back loses nothing.
  const draftKey = existing ? `edit:${existing.id}` : params.prompt ? `prompt:${params.noteId ?? ''}:${params.prompt}` : mode;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    drafts.load(draftKey).then((d) => {
      if (cancelled) return;
      if (d) {
        setText(d.text);
        if (d.prompt) setPrompt(d.prompt);
        if (d.photo) setPhoto(d.photo);
      } else if (!existing) {
        if (mode === 'question' && !prompt) newPrompt();
        if (mode === 'photo' && !photo) newPhoto();
      }
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded && text !== (existing?.text ?? '')) drafts.save(draftKey, { text, prompt, photo });
  }, [loaded, draftKey, text, prompt, photo, existing?.text]);

  const fixSentence = () =>
    run('sentence', async () => {
      const [a, b] = sentenceAt(text, sel.current.start);
      const target = text.slice(a, b);
      if (!target.trim()) throw new Error('Đặt con trỏ vào câu muốn sửa');
      const { corrected } = await api.correct(target, 'sentence', text);
      if (corrected === target) return setUndo(null), setError('Câu này đã tự nhiên rồi');
      setUndo({ text, msg: 'Đã sửa câu đang chọn' });
      setText(text.slice(0, a) + corrected + text.slice(b));
    });

  const fixAll = () =>
    run('all', async () => {
      if (!text.trim()) throw new Error('Chưa có nội dung');
      const { corrected } = await api.correct(text, 'all');
      setUndo({ text, msg: 'Đã sửa cả đoạn' });
      setText(corrected);
    });

  // Live dictation replaces only the spoken part, inserted at the cursor position from when recording began.
  const dict = useRef({ before: '', after: '' });
  const mic = useRef<MicHandle>(null);
  const startDictation = () => {
    const at = Math.min(sel.current.start, text.length);
    dict.current = { before: text.slice(0, at), after: text.slice(Math.max(sel.current.end, at)) };
    setUndo(null);
    setError(null);
  };
  const onSpoken = (spoken: string, final: boolean) => {
    const { before, after } = dict.current;
    setText(before + spoken + after);
    if (final) sel.current = { start: before.length + spoken.length, end: before.length + spoken.length };
  };

  const done = async () => {
    const final = mic.current?.isRecording() ? dict.current.before + (await mic.current.stop()) + dict.current.after : text;
    if (!final.trim()) return setError('Viết gì đó trước đã');
    const id = store.saveEntry({
      id: existing?.id,
      mode,
      prompt,
      text: final.trim(),
      photo: photo && { url: photo.url, author: photo.author, source: photo.source },
    });
    if (params.noteId) store.updateNote(params.noteId, { usedAt: Date.now() });
    drafts.clear(draftKey);
    router.replace(`/read/${id}`);
  };

  return (
    <Page
      header={
        <Header
          title={MODE_LABEL[mode]}
          right={<Btn kind="dark" small label="Xong · Đọc lại" onPress={done} style={{ marginRight: 4 }} />}
        />
      }
      footer={
        <View style={s.row}>
          <T style={{ flex: 1, color: C.muted, fontSize: 14 }}>
            <T style={{ fontWeight: '700', fontSize: 14 }}>{countChars(text)}</T> 字
          </T>
          <MicButton ref={mic} onStart={startDictation} onText={onSpoken} onError={setError} />
          <Btn kind="outline" label="Sửa câu" onPress={fixSentence} loading={busy === 'sentence'} disabled={!!busy} />
          <Btn label="Sửa cả đoạn" onPress={fixAll} loading={busy === 'all'} disabled={!!busy} />
        </View>
      }>
      {mode === 'question' && !params.prompt && !existing && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
          <View style={{ width: 12 }} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              on={category === c.id}
              onPress={() => {
                setCategory(c.id);
                newPrompt(c.id);
              }}
            />
          ))}
          <View style={{ width: 12 }} />
        </ScrollView>
      )}

      {mode === 'photo' && (
        <View style={{ gap: 6 }}>
          <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: '#D8D1C1', aspectRatio: 3 / 2 }}>
            {photo ? (
              <Image source={{ uri: photo.url }} style={{ flex: 1 }} contentFit="cover" transition={200} accessibilityLabel="Ảnh để mô tả" />
            ) : null}
          </View>
          <View style={[s.row, { justifyContent: 'space-between' }]}>
            <Pressable onPress={() => photo?.link && Linking.openURL(photo.link)}>
              <T style={s.small}>{photo ? `Ảnh: ${photo.author || 'ẩn danh'} / ${photo.source}` : 'Đang tải ảnh…'}</T>
            </Pressable>
            {!existing && <Btn kind="ghost" small icon="refresh" label="Ảnh khác" loading={busy === 'photo'} onPress={newPhoto} />}
          </View>
          <View style={[s.row, { flexWrap: 'wrap', gap: 6 }]}>
            {PHOTO_GUIDES.map((g) => (
              <View key={g} style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: C.sunk, justifyContent: 'center' }}>
                <T style={{ fontSize: 13, color: '#4A4F5C' }}>{g}</T>
              </View>
            ))}
          </View>
        </View>
      )}

      {mode !== 'photo' && (
        <Card>
          <Label color={C.shu}>{mode === 'diary' ? 'NHẬT KÝ HÔM NAY' : 'ĐỀ'}</Label>
          <T jp style={{ fontSize: 18, lineHeight: 30, fontWeight: '600' }}>
            {prompt || (busy === 'prompt' ? 'Đang ra đề…' : '—')}
          </T>
          <View style={s.row}>
            {mode === 'question' && !params.prompt && !existing && (
              <Btn kind="ghost" small icon="refresh" label="Đổi đề" loading={busy === 'prompt'} onPress={() => newPrompt()} />
            )}
            {prompt ? (
              <Btn kind="ghost" small icon="speaker" label="Nghe đề" onPress={() => (speaker.speaking ? speaker.stop() : speaker.speak(prompt))} />
            ) : null}
          </View>
        </Card>
      )}

      <Field
        jp
        multiline
        value={text}
        onChangeText={(t) => {
          setText(t);
          setUndo(null);
        }}
        onSelectionChange={(e) => (sel.current = e.nativeEvent.selection)}
        placeholder="書いてみよう…"
        accessibilityLabel="Bài viết của bạn"
        style={{
          minHeight: 260,
          fontSize: 17,
          lineHeight: 32,
          padding: 16,
          borderRadius: 14,
          ...(undo ? { borderColor: C.shu, backgroundColor: C.shuWash } : null),
        }}
      />
      {undo && (
        <Toast
          text={undo.msg}
          action="Hoàn tác"
          onAction={() => {
            setText(undo.text);
            setUndo(null);
          }}
        />
      )}
      <ErrorText text={error} />
      <View style={[s.row, { justifyContent: 'center' }]}>
        <Icon name="bulb" size={14} color={C.faint} />
        <T style={{ fontSize: 12, color: C.faint }}>Nút “Sửa câu” sửa câu đang có con trỏ</T>
      </View>
    </Page>
  );
}
