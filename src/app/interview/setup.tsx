import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { Btn, Card, Chip, ErrorText, Field, Header, Icon, Label, Page, s, T } from '@/components/ui';
import { C } from '@/constants/theme';
import { api } from '@/lib/api';
import { shortDate } from '@/lib/dates';
import { useStore, type Company } from '@/lib/store';

const LEVELS = [
  { id: 'easy', label: 'Nhẹ nhàng' },
  { id: 'normal', label: 'Bình thường' },
  { id: 'hard', label: 'Gắt (圧迫)' },
];

const BLANK: Omit<Company, 'id'> = { name: '', url: '', summary: '', role: '新卒 ITエンジニア', note: '' };

export default function InterviewSetup() {
  const store = useStore();
  const { profile, companies } = store;
  const [pasting, setPasting] = useState(false);
  const [cvDraft, setCvDraft] = useState('');
  const [company, setCompany] = useState<Omit<Company, 'id'> & { id?: string }>(companies[0] ?? BLANK);
  const [level, setLevel] = useState('normal');
  const [busy, setBusy] = useState<'pdf' | 'url' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (p: Partial<Company>) => setCompany((c) => ({ ...c, ...p }));

  const pickPdf = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (res.canceled) return;
    const asset = res.assets[0];
    setBusy('pdf');
    setError(null);
    try {
      const { text } = await api.cv(asset);
      store.setProfile({ cvName: asset.name, cvText: text, cvUpdatedAt: Date.now() });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const savePaste = () => {
    if (!cvDraft.trim()) return;
    store.setProfile({ cvName: 'CV (dán text)', cvText: cvDraft.trim(), cvUpdatedAt: Date.now() });
    setPasting(false);
  };

  const readSite = async () => {
    const url = company.url.trim();
    if (!url) return setError('Dán link trang chủ công ty trước');
    setBusy('url');
    setError(null);
    try {
      const out = await api.company(/^https?:\/\//.test(url) ? url : `https://${url}`);
      set({ name: out.name, summary: out.summary, url: out.url });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const start = () => {
    if (!profile.cvText) return setError('Thêm CV trước để người phỏng vấn hỏi sát hơn');
    const id = company.name || company.summary ? store.saveCompany(company) : undefined;
    router.replace({ pathname: '/interview/session', params: { companyId: id ?? '', level } });
  };

  return (
    <Page header={<Header title="Chuẩn bị phỏng vấn" />} footer={<Btn kind="ai" label="Bắt đầu phỏng vấn" onPress={start} />}>
      <Card>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <T style={{ fontWeight: '700' }}>CV của bạn</T>
          <T style={s.small}>Dùng cho mọi buổi</T>
        </View>
        {profile.cvText ? (
          <View style={[s.row, { gap: 12, padding: 12, borderRadius: 12, backgroundColor: C.aiWash }]}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.ai, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="doc" color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <T numberOfLines={1} style={{ fontWeight: '600', fontSize: 14 }}>
                {profile.cvName}
              </T>
              <T style={s.small}>
                Đã đọc {profile.cvText.length} ký tự{profile.cvUpdatedAt ? ` · ${shortDate(profile.cvUpdatedAt)}` : ''}
              </T>
            </View>
          </View>
        ) : (
          <T style={{ color: C.muted, fontSize: 14 }}>Chưa có CV. Tải PDF (履歴書 / 職務経歴書) hoặc dán nội dung.</T>
        )}
        <View style={s.row}>
          <Btn kind="ghost" label="Tải PDF" icon="doc" loading={busy === 'pdf'} onPress={pickPdf} style={{ flex: 1 }} />
          <Btn kind="ghost" label="Dán text" onPress={() => (setCvDraft(profile.cvText), setPasting(!pasting))} style={{ flex: 1 }} />
        </View>
        {pasting && (
          <View style={{ gap: 8 }}>
            <Field multiline value={cvDraft} onChangeText={setCvDraft} placeholder="Dán nội dung CV vào đây…" accessibilityLabel="Nội dung CV" style={{ minHeight: 140 }} />
            <Btn kind="ai" small label="Lưu CV" onPress={savePaste} style={{ alignSelf: 'flex-end' }} />
          </View>
        )}
      </Card>

      <Card>
        <T style={{ fontWeight: '700' }}>Công ty ứng tuyển</T>
        {companies.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            <Chip label="+ Công ty mới" on={!company.id} onPress={() => setCompany(BLANK)} />
            {companies.map((c) => (
              <Chip key={c.id} label={c.name || c.url} on={company.id === c.id} onPress={() => setCompany(c)} />
            ))}
          </ScrollView>
        )}
        <Label>LINK TRANG CHỦ</Label>
        <View style={s.row}>
          <Field
            value={company.url}
            onChangeText={(url) => set({ url })}
            placeholder="https://…co.jp"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="Link trang chủ công ty"
            style={{ flex: 1 }}
          />
          <Btn kind="ai" label="Đọc" loading={busy === 'url'} onPress={readSite} />
        </View>
        <Label>TÊN CÔNG TY</Label>
        <Field value={company.name} onChangeText={(name) => set({ name })} placeholder="Tự điền sau khi đọc link" accessibilityLabel="Tên công ty" />
        <Label>TÓM TẮT (AI đọc từ trang chủ, sửa được)</Label>
        <Field multiline value={company.summary} onChangeText={(summary) => set({ summary })} placeholder="Lĩnh vực, sản phẩm, 企業理念…" accessibilityLabel="Tóm tắt công ty" style={{ minHeight: 100, backgroundColor: C.aiWash }} />
        <Label>VỊ TRÍ ỨNG TUYỂN</Label>
        <Field jp value={company.role} onChangeText={(role) => set({ role })} accessibilityLabel="Vị trí ứng tuyển" />
        <Label>GHI CHÚ THÊM</Label>
        <Field multiline value={company.note} onChangeText={(note) => set({ note })} placeholder="VD: vòng 2, phỏng vấn với trưởng phòng kỹ thuật…" accessibilityLabel="Ghi chú" style={{ minHeight: 64 }} />
      </Card>

      <View style={{ gap: 8 }}>
        <T style={{ fontWeight: '700' }}>Kiểu buổi phỏng vấn</T>
        <View style={s.row}>
          {LEVELS.map((l) => (
            <Chip key={l.id} label={l.label} on={level === l.id} onPress={() => setLevel(l.id)} />
          ))}
        </View>
      </View>
      <ErrorText text={error} />
    </Page>
  );
}
