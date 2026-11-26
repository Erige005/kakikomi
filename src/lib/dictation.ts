import { requestRecordingPermissionsAsync, setAudioModeAsync, useAudioStream } from 'expo-audio';
import { useRef, useState } from 'react';

import { LiveTranscriber } from './live';

type Opts = { onText: (text: string, final: boolean) => void; onError: (msg: string) => void };

export function useDictation(opts: Opts) {
  const live = useRef<LiveTranscriber | null>(null);
  const [state, setState] = useState<'idle' | 'recording' | 'busy'>('idle');

  const { stream } = useAudioStream({
    sampleRate: 16000,
    channels: 1,
    encoding: 'int16',
    onBuffer: (b) => {
      const l = live.current;
      if (!l) return;
      l.rate = b.sampleRate;
      const pcm = new Int16Array(b.data.slice(0));
      l.push(b.channels > 1 ? pcm.filter((_, i) => i % b.channels === 0) : pcm);
    },
  });

  return {
    state,
    async start() {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) throw new Error('Chưa cho phép dùng micro');
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      live.current = new LiveTranscriber(opts);
      await stream.start();
      live.current.start();
      setState('recording');
    },
    isActive: () => live.current !== null,
    async stop(): Promise<string> {
      const l = live.current;
      if (!l) return '';
      live.current = null;
      setState('busy');
      try {
        stream.stop();
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        return await l.stop();
      } finally {
        setState('idle');
      }
    },
  };
}
