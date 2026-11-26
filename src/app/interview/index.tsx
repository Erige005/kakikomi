import { router } from 'expo-router';
import { View } from 'react-native';

import { InterviewList } from '@/components/interview-list';
import { Header, Page } from '@/components/ui';

export default function Interviews() {
  return (
    <Page header={<Header title="Phỏng vấn thử" sub="Chọn cuộc cũ để trả lời tiếp" />} scroll={false}>
      <View style={{ flex: 1, marginHorizontal: -12 }}>
        <InterviewList onOpen={(id) => router.push({ pathname: '/interview/session', params: { entryId: id } })} />
      </View>
    </Page>
  );
}
