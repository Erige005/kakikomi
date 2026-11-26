import { useRef, useState } from 'react';

import { LiveTranscriber } from './live';

type Opts = { onText: (text: string, final: boolean) => void; onError: (msg: string) => void };

/** expo-audio has no AudioStream on web, so capture PCM with the Web Audio API. */
export function useDictation(opts: Opts) {
  const rec = useRef<{ live: LiveTranscriber; ctx: AudioContext; stream: MediaStream } | null>(null);
  const [state, setState] = useState<'idle' | 'recording' | 'busy'>('idle');

  return {
    state,
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true } }).catch(() => {
        throw new Error('Chưa cho phép dùng micro');
      });
      const ctx = new AudioContext({ sampleRate: 16000 });
      const live = new LiveTranscriber(opts);
      live.rate = ctx.sampleRate;

      const src = ctx.createMediaStreamSource(stream);
      // ScriptProcessor is deprecated but needs no separate worklet file; fine for mic capture.
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      proc.onaudioprocess = (e) => {
        const f = e.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(f.length);
        for (let i = 0; i < f.length; i++) pcm[i] = Math.max(-1, Math.min(1, f[i])) * 0x7fff;
        live.push(pcm);
      };
      src.connect(proc);
      proc.connect(ctx.destination);

      rec.current = { live, ctx, stream };
      live.start();
      setState('recording');
    },
    isActive: () => rec.current !== null,
    async stop(): Promise<string> {
      const r = rec.current;
      if (!r) return '';
      rec.current = null;
      setState('busy');
      try {
        r.stream.getTracks().forEach((t) => t.stop());
        await r.ctx.close();
        return await r.live.stop();
      } finally {
        setState('idle');
      }
    },
  };
}
