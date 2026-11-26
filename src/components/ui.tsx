import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, Fonts, MaxWidth } from '@/constants/theme';

const ICONS = {
  back: ['chevron.left', 'arrow_back_ios_new'],
  flame: ['flame.fill', 'local_fire_department'],
  plus: ['plus', 'add'],
  next: ['chevron.right', 'chevron_right'],
  prev: ['chevron.left', 'chevron_left'],
  refresh: ['arrow.clockwise', 'refresh'],
  speaker: ['speaker.wave.2.fill', 'volume_up'],
  bigText: ['textformat.size', 'format_size'],
  play: ['play.fill', 'play_arrow'],
  pause: ['pause.fill', 'pause'],
  send: ['paperplane.fill', 'send'],
  doc: ['doc.text', 'description'],
  bubble: ['bubble.left', 'chat_bubble'],
  book: ['book', 'menu_book'],
  photo: ['photo', 'image'],
  link: ['link', 'link'],
  bulb: ['lightbulb', 'lightbulb'],
  work: ['briefcase', 'work'],
  check: ['checkmark', 'check'],
  trash: ['trash', 'delete'],
  close: ['xmark', 'close'],
  mic: ['mic.fill', 'mic'],
  stop: ['stop.fill', 'stop'],
  marker: ['highlighter', 'ink_highlighter'],
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color = C.ink }: { name: IconName; size?: number; color?: string }) {
  const [ios, md] = ICONS[name];
  return <SymbolView name={{ ios, android: md, web: md }} size={size} tintColor={color} />;
}

/** Scrollable page with optional sticky footer; centers content on wide screens. */
export function Page({
  header,
  footer,
  children,
  scroll = true,
  topInset = true,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  topInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const body = <View style={s.inner}>{children}</View>;
  return (
    <View style={[s.page, topInset && { paddingTop: insets.top }]}>
      {header}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentInsetAdjustmentBehavior="automatic"
          automaticallyAdjustKeyboardInsets>
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{body}</View>
      )}
      {footer ? <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View> : null}
    </View>
  );
}

export function Header({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <View style={s.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        hitSlop={8}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={s.back}>
        <Icon name="back" />
      </Pressable>
      <View style={{ flex: 1 }}>
        <T style={s.headerTitle}>{title}</T>
        {sub ? <T style={s.small}>{sub}</T> : null}
      </View>
      {right}
    </View>
  );
}

export function T({ style, jp, ...p }: TextProps & { jp?: boolean }) {
  return <Text {...p} style={[{ color: C.ink, fontFamily: jp ? Fonts.jp : Fonts.sans, fontSize: 15 }, style]} />;
}

type BtnKind = 'primary' | 'outline' | 'ghost' | 'dark' | 'ai';

export function Btn({
  label,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  style,
  small,
}: {
  label?: string;
  onPress?: () => void;
  kind?: BtnKind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const k = BTN[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        { backgroundColor: k.bg, borderColor: k.border },
        (pressed || disabled) && { opacity: disabled ? 0.45 : 0.75 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={k.fg} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={small ? 15 : 18} color={k.fg} /> : null}
          {label ? <T style={[s.btnText, small && { fontSize: 13 }, { color: k.fg }]}>{label}</T> : null}
        </>
      )}
    </Pressable>
  );
}

const BTN: Record<BtnKind, { bg: string; fg: string; border: string }> = {
  primary: { bg: C.shu, fg: '#FFFFFF', border: C.shu },
  outline: { bg: C.surface, fg: C.shu, border: C.shu },
  ghost: { bg: C.surface, fg: C.ink, border: C.line },
  dark: { bg: C.ink, fg: '#FFFFFF', border: C.ink },
  ai: { bg: C.ai, fg: '#FFFFFF', border: C.ai },
};

export function Chip({ label, on, onPress }: { label: string; on?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      onPress={onPress}
      style={[s.chip, on ? { backgroundColor: C.ink, borderColor: C.ink } : null]}>
      <T style={[s.chipText, on ? { color: '#FFFFFF' } : null]}>{label}</T>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Label({ children, color = C.muted }: { children: ReactNode; color?: string }) {
  return <T style={[s.label, { color }]}>{children}</T>;
}

export function Field(props: TextInputProps & { jp?: boolean }) {
  const { jp, style, ...rest } = props;
  return (
    <TextInput
      placeholderTextColor={C.faint}
      {...rest}
      style={[s.field, { fontFamily: jp ? Fonts.jp : Fonts.sans }, rest.multiline && { textAlignVertical: 'top' }, style]}
    />
  );
}

export function Toast({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <View accessibilityLiveRegion="polite" style={s.toast}>
      <Icon name="check" size={16} color="#FFB4A3" />
      <T style={{ flex: 1, color: '#FFFFFF', fontSize: 14 }}>{text}</T>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={s.toastBtn}>
          <T style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '600' }}>{action}</T>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ErrorText({ text }: { text?: string | null }) {
  if (!text) return null;
  return <T style={{ color: C.shuDark, fontSize: 13 }}>{text}</T>;
}

export const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.ground },
  scroll: { paddingBottom: 32, flexGrow: 1 },
  inner: { width: '100%', maxWidth: MaxWidth, alignSelf: 'center', paddingHorizontal: 20, gap: 14, flexGrow: 1 },
  footer: {
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: '100%',
    maxWidth: MaxWidth + 24,
    alignSelf: 'center',
  },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  small: { fontSize: 12, color: C.muted },
  btn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSmall: { height: 36, paddingHorizontal: 12, borderRadius: 18 },
  btnText: { fontSize: 15, fontWeight: '600' },
  chip: {
    height: 38,
    paddingHorizontal: 15,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.surface,
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '500' },
  card: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 16, gap: 12 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  field: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    backgroundColor: C.surface,
    color: C.ink,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.ink,
    borderRadius: 12,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 8,
  },
  toastBtn: { height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
