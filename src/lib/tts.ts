import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';

let jaVoice: string | undefined;
let looked = false;

async function pickVoice() {
  if (looked) return jaVoice;
  looked = true;
  const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
  const ja = voices.filter((v) => v.language?.startsWith('ja'));
  jaVoice = (ja.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ?? ja[0])?.identifier;
  return jaVoice;
}

export function useSpeaker() {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => () => void Speech.stop(), []);

  return {
    speaking,
    async speak(text: string, rate = 1) {
      await Speech.stop();
      const voice = await pickVoice();
      setSpeaking(true);
      const done = () => setSpeaking(false);
      Speech.speak(text, { language: 'ja-JP', voice, rate, onDone: done, onStopped: done, onError: done });
    },
    stop() {
      Speech.stop();
      setSpeaking(false);
    },
  };
}
