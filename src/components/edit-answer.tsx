import { useState } from 'react';
import { View } from 'react-native';

import { Btn, Field, s, T } from '@/components/ui';

/** Inline editor for an answer that was already sent. */
export function EditAnswer({ value, note, onSave, onCancel }: { value: string; note?: string; onSave: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState(value);
  return (
    <View style={{ gap: 8 }}>
      <Field jp multiline autoFocus value={text} onChangeText={setText} accessibilityLabel="Sửa câu trả lời" style={{ minHeight: 88, lineHeight: 26 }} />
      <View style={[s.row, { justifyContent: 'flex-end' }]}>
        {note ? <T style={[s.small, { flex: 1 }]}>{note}</T> : null}
        <Btn kind="ghost" small label="Huỷ" onPress={onCancel} />
        <Btn small label={note ? 'Lưu & hỏi lại' : 'Lưu'} disabled={!text.trim()} onPress={() => onSave(text.trim())} />
      </View>
    </View>
  );
}
