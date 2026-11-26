import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Icon, T, type IconName } from '@/components/ui';
import { C } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={styles.bar}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="book">Viết</TabButton>
        </TabTrigger>
        <TabTrigger name="notes" href="/notes" asChild>
          <TabButton icon="bulb">Note</TabButton>
        </TabTrigger>
        <TabTrigger name="archive" href="/archive" asChild>
          <TabButton icon="doc">Kho bài</TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName }) {
  const color = isFocused ? C.shu : C.muted;
  return (
    <Pressable {...(props as PressableProps)} style={styles.btn}>
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Icon name={icon} size={20} color={color} />
        <T style={{ fontSize: 12, fontWeight: '600', color }}>{children}</T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.surface,
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingVertical: 6,
  },
  btn: { minWidth: 96, height: 52, alignItems: 'center', justifyContent: 'center' },
});
