import { useImperativeHandle, type Ref } from 'react';
import { ActivityIndicator, Pressable } from 'react-native';

import { Icon } from '@/components/ui';
import { C } from '@/constants/theme';
import { useDictation } from '@/lib/dictation';

export type MicHandle = {
  isRecording: () => boolean;
  /** Stops recording and resolves with the final transcript. */
  stop: () => Promise<string>;
};

type Props = {
  ref?: Ref<MicHandle>;
  /** Called right before recording starts, so the screen can remember where to put the text. */
  onStart: () => void;
  /** Full transcript so far; `final` is true once after stopping. */
  onText: (text: string, final: boolean) => void;
  onError: (msg: string) => void;
  size?: number;
};

/** Tap to record, tap again to stop; text streams in while speaking. */
export function MicButton({ ref, onStart, onText, onError, size = 48 }: Props) {
  const d = useDictation({ onText, onError });
  useImperativeHandle(ref, () => ({ isRecording: d.isActive, stop: d.stop }));
  const recording = d.state === 'recording';

  const press = async () => {
    try {
      if (recording) await d.stop();
      else {
        onStart();
        await d.start();
      }
    } catch (e) {
      onError((e as Error).message);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Dừng ghi âm' : 'Ghi âm để nhập chữ'}
      onPress={press}
      disabled={d.state === 'busy'}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: recording ? C.shu : C.line,
        backgroundColor: recording ? C.shu : C.surface,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {d.state === 'busy' ? <ActivityIndicator color={C.shu} /> : <Icon name={recording ? 'stop' : 'mic'} color={recording ? '#FFFFFF' : C.shu} />}
    </Pressable>
  );
}
