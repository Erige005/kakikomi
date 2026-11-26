import { api } from './api';

const TICK_MS = 1000;
const SEGMENT_SEC = 20;

type Listener = { onText: (text: string, final: boolean) => void; onError: (msg: string) => void };

/**
 * Re-transcribes the audio of the current segment about once a second so text appears while speaking.
 * Segments are committed every ~20 s to keep each Whisper request short.
 */
export class LiveTranscriber {
  private chunks: Int16Array[] = [];
  private len = 0;
  private sentLen = 0;
  private committed = '';
  private segText = '';
  private inflight: Promise<void> | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private failed = false;
  rate = 16000;

  constructor(private l: Listener) {}

  push(pcm: Int16Array) {
    this.chunks.push(pcm);
    this.len += pcm.length;
  }

  start() {
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  async stop(): Promise<string> {
    if (this.timer) clearInterval(this.timer);
    await this.inflight;
    if (this.len > this.sentLen) await this.run(() => this.transcribeSegment());
    this.committed = join(this.committed, this.segText);
    this.l.onText(this.committed, true);
    return this.committed;
  }

  private tick() {
    if (this.inflight || this.len - this.sentLen < this.rate * 0.5) return;
    this.inflight = this.run(() => (this.len > this.rate * SEGMENT_SEC ? this.commitSegment() : this.transcribeSegment())).finally(
      () => (this.inflight = null),
    );
  }

  private async run(fn: () => Promise<void>) {
    try {
      await fn();
    } catch (e) {
      if (!this.failed) this.l.onError((e as Error).message);
      this.failed = true;
    }
  }

  private async transcribeSegment() {
    const n = this.len;
    if (!isSpeech(this.chunks)) {
      this.sentLen = n;
      return;
    }
    const { text } = await api.transcribe(wavBase64(this.chunks, this.rate));
    this.sentLen = n;
    this.segText = text;
    this.l.onText(join(this.committed, text), false);
  }

  private async commitSegment() {
    const chunks = this.chunks;
    this.chunks = [];
    this.len = 0;
    this.sentLen = 0;
    const { text } = isSpeech(chunks) ? await api.transcribe(wavBase64(chunks, this.rate)) : { text: '' };
    this.committed = join(this.committed, text);
    this.segText = '';
    this.l.onText(this.committed, false);
  }
}

const join = (a: string, b: string) => a + b;

function isSpeech(chunks: Int16Array[]) {
  let peak = 0;
  for (const c of chunks) for (let i = 0; i < c.length; i += 16) peak = Math.max(peak, Math.abs(c[i]));
  return peak > 900;
}

function wavBase64(chunks: Int16Array[], rate: number) {
  const samples = chunks.reduce((n, c) => n + c.length, 0);
  const bytes = new Uint8Array(44 + samples * 2);
  const v = new DataView(bytes.buffer);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i);
  };
  str(0, 'RIFF');
  v.setUint32(4, 36 + samples * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, samples * 2, true);
  let o = 44;
  for (const c of chunks)
    for (let i = 0; i < c.length; i++, o += 2) v.setInt16(o, c[i], true);

  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}
