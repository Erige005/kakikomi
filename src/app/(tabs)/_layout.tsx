import { NativeTabs } from 'expo-router/native-tabs';

import { C } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <NativeTabs tintColor={C.shu}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Viết</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.and.pencil', selected: 'square.and.pencil' }} md="edit" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="notes">
        <NativeTabs.Trigger.Label>Note</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'lightbulb', selected: 'lightbulb.fill' }} md="lightbulb" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="archive">
        <NativeTabs.Trigger.Label>Kho bài</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'tray.full', selected: 'tray.full.fill' }} md="inventory_2" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
