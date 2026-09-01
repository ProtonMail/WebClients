import type { ReactNode } from 'react';

import { AnalyticsProvider } from '@proton/meet/contexts/AnalyticsContext';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectInstantMeeting,
    selectMeetingLinkName,
    selectMeetingNavigationSeed,
} from '@proton/meet/store/slices/currentMeeting';
import { selectWaitingRoomSetting } from '@proton/meet/store/slices/settings';

import { supportsSetSinkId } from '../../utils/browser';

export const MeetingAnalyticsProvider = ({ sampleRate, children }: { sampleRate: number; children: ReactNode }) => {
    const meetingLinkName = useMeetSelector(selectMeetingLinkName);
    const waitingRoomSetting = useMeetSelector(selectWaitingRoomSetting);
    const instantMeeting = useMeetSelector(selectInstantMeeting);
    const hasNavigationSeed = !!useMeetSelector(selectMeetingNavigationSeed);

    return (
        <AnalyticsProvider
            attributes={{
                meetingLinkName,
                sampleRate,
                waitingRoom: waitingRoomSetting,
                instantMeeting,
                hasNavigationSeed,
                supportSetSinkId: supportsSetSinkId(),
            }}
        >
            {children}
        </AnalyticsProvider>
    );
};
