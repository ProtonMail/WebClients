import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetings } from '@proton/meet/store/slices/meetings';
import { getMeetingTypeDimension } from '@proton/meet/telemetry/dimensions';
import type { JoinSource, MeetingTypeDimension } from '@proton/meet/telemetry/events';

import type { JoinLocationState } from '../types';

export interface JoinTelemetryDimensions {
    joinSource: JoinSource;
    meetingType: MeetingTypeDimension;
}

/**
 * The meeting type is only known for meetings the user owns, from the dashboard meeting list.
 */
export const useJoinTelemetryDimensions = ({
    meetingLinkName,
    isInstant,
}: {
    meetingLinkName: string;
    isInstant: boolean;
}): JoinTelemetryDimensions => {
    const location = useLocation<JoinLocationState | undefined>();
    const meetings = useMeetSelector(selectMeetings).value;

    // The route state is gone once the instant meeting has its link, so it is read on mount
    const [joinSource] = useState<JoinSource>(() => {
        if (isInstant) {
            return 'instant';
        }
        return location.state?.meetingDetails ? 'dashboard' : 'link';
    });

    const meetingType = isInstant
        ? 'instant'
        : getMeetingTypeDimension(meetings?.find((meeting) => meeting.MeetingLinkName === meetingLinkName)?.Type);

    return { joinSource, meetingType };
};
