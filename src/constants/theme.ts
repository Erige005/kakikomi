import '@/global.css';

import { Platform } from 'react-native';

export const C = {
  ground: '#F6F3EC',
  surface: '#FFFFFF',
  soft: '#FBF9F4',
  sunk: '#ECE7DC',
  line: '#E3DED2',
  ink: '#1F2430',
  muted: '#5E6372',
  faint: '#9A9EA8',
  shu: '#B83A25',
  shuDark: '#8F2B1A',
  shuTint: '#F8E4DE',
  shuWash: '#FFF8F5',
  ai: '#2F4A7A',
  aiTint: '#E3E9F4',
  aiWash: '#F1F4FA',
  flame: '#E8743B',
  marker: '#FFE680',
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'System', jp: 'Hiragino Mincho ProN' },
  web: { sans: 'var(--font-display)', jp: 'var(--font-serif)' },
  default: { sans: 'sans-serif', jp: 'serif' },
});

export const MaxWidth = 720;
