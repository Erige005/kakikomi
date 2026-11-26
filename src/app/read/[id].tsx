import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, View, type TextStyle } from 'react-native';

import { MarkBar, Markable, usePick, withMark } from '@/components/marked';
import { Btn, Card, Chip, Header, Icon, Page, s, T, Toast } from '@/components/ui';
import { MODE_LABEL } from '@/constants/modes';
import { C } from '@/constants/theme';
import { countChars, shortDate } from '@/lib/dates';
import { useStore } from '@/lib/store';
import { useSpeaker } from '@/lib/tts';

const SPEEDS = [0.6, 0.8, 1.0];

export default function Read() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const entry = store.entries.find((e) => e.id === id);
  const [big, setBig] = useState(false);
  const [rate, setRate] = useState(0.8);
  const speaker = useSpeaker();
  const [pick, setPick] = usePick();
  const [removed, setRemoved] = useState<string[] | null>(null);

  if (!entry) {
    return (
      <Page header={<Header title="Đọc lại" />}>
        <T style={{ color: C.muted }}>{store.ready ? 'Không tìm thấy bài này.' : 'Đang tải…'}</T>
      </Page>
    );
  }

  const bodySize = big ? { fontSize: 24, lineHeight: 50 } : { fontSize: 18, lineHeight: 36 };
  const isDialog = entry.mode === 'chain' || entry.mode === 'interview';
  const spoken = isDialog ? (entry.turns ?? []).map((t) => `${t.q}\n${t.a}`).join('\n') : entry.text;
  const toggle = () => (speaker.speaking ? speaker.stop() : speaker.speak(spoken, rate));

  const marks = entry.marks ?? [];
  const addMark = () => {
    store.setMarks(entry.id, withMark(marks, pick));
    setPick(null);
  };
  const unmark = (ms: string[]) => {
    store.setMarks(
      entry.id,
      marks.filter((m) => !ms.includes(m)),
    );
    setRemoved(ms);
  };
  const body = (text: string, style: TextStyle) => <Markable text={text} marks={marks} onUnmark={unmark} onPick={setPick} style={style} />;

  const remove = () => {
    store.deleteEntry(entry.id);
    router.back();
  };

  return (
    <Page
      header={
        <Header
          title="Đọc lại"
          sub={`${shortDate(entry.createdAt)} · ${MODE_LABEL[entry.mode]} · ${countChars(entry.text)} 字`}
          right={<Btn kind={big ? 'primary' : 'ghost'} small icon="bigText" label="Đọc to" onPress={() => setBig(!big)} style={{ marginRight: 4 }} />}
        />
      }
      footer={
        pick ? (
          <MarkBar pick={pick} onMark={addMark} />
        ) : (
          <View style={s.row}>
            {entry.mode === 'interview' ? (
              <Btn kind="outline" label="Trả lời tiếp" style={{ flex: 1 }} onPress={() => router.replace({ pathname: '/interview/session', params: { entryId: entry.id } })} />
            ) : (
              <Btn
                kind="outline"
                label="Viết tiếp chủ đề"
                style={{ flex: 1 }}
                onPress={() =>
                  router.push({
                    pathname: '/chain',
                    params: { seedId: entry.id },
                  })
                }
              />
            )}
            {!isDialog && <Btn kind="ghost" label="Sửa bài" onPress={() => router.push({ pathname: '/write', params: { id: entry.id } })} />}
            <Btn label="Xong" style={{ flex: 1 }} onPress={() => router.dismissTo('/')} />
          </View>
        )
      }>
      {!big && entry.prompt && !isDialog ? (
        <T jp style={{ fontSize: 14, lineHeight: 24, color: C.muted }}>
          {entry.prompt}
        </T>
      ) : null}
      {!big && entry.photo ? <Image source={{ uri: entry.photo.url }} style={{ aspectRatio: 3 / 2, borderRadius: 14 }} contentFit="cover" /> : null}

      <Card style={{ paddingVertical: 20, gap: 16 }}>
        {isDialog
          ? (entry.turns ?? []).map((t, i) => (
              <View key={i} style={{ gap: 6 }}>
                <View style={[s.row, { alignItems: 'flex-start', gap: 4 }]}>
                  <T jp style={{ color: C.ai, fontWeight: '600', fontSize: bodySize.fontSize - 3, lineHeight: bodySize.lineHeight - 6 }}>
                    {entry.mode === 'interview' ? '面接官：' : '問：'}
                  </T>
                  <View style={{ flex: 1 }}>{body(t.q, { color: C.ai, fontWeight: '600', fontSize: bodySize.fontSize - 3, lineHeight: bodySize.lineHeight - 6 })}</View>
                </View>
                {t.a ? body(t.a, bodySize) : null}
              </View>
            ))
          : body(entry.text, bodySize)}
      </Card>
      {removed ? (
        <Toast
          text="Đã bỏ tô"
          action="Hoàn tác"
          onAction={() => {
            store.setMarks(entry.id, [...marks, ...removed]);
            setRemoved(null);
          }}
        />
      ) : (
        <T style={[s.small, { textAlign: 'center' }]}>
          {Platform.OS === 'web' ? 'Bôi đen chữ để tô màu' : 'Giữ lâu vào chữ để bôi đen và tô màu'}
          {marks.length ? ' · chạm chỗ đã tô để bỏ' : ''}
        </T>
      )}

      <Card>
        <View style={[s.row, { gap: 12 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={speaker.speaking ? 'Dừng' : 'Phát'}
            onPress={toggle}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: C.shu,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon name={speaker.speaking ? 'pause' : 'play'} size={22} color="#FFFFFF" />
          </Pressable>
          <View style={{ flex: 1, gap: 2 }}>
            <T style={{ fontWeight: '600', fontSize: 14 }}>Nghe bài viết</T>
            <T style={s.small}>Giọng tiếng Nhật của máy</T>
          </View>
        </View>
        <View style={s.row}>
          {SPEEDS.map((r) => (
            <Chip key={r} label={`${r.toFixed(1)}×`} on={rate === r} onPress={() => setRate(r)} />
          ))}
        </View>
      </Card>

      <Pressable accessibilityRole="button" onPress={remove} style={[s.row, { justifyContent: 'center', paddingVertical: 12 }]}>
        <Icon name="trash" size={16} color={C.muted} />
        <T style={{ color: C.muted, fontSize: 14 }}>Xoá bài này</T>
      </Pressable>
    </Page>
  );
}
