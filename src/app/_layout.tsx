import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { C } from '@/constants/theme';
import { StoreProvider } from '@/lib/store';

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.ground, primary: C.shu } };

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.ground } }} />
      </StoreProvider>
    </ThemeProvider>
  );
}
