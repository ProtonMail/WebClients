import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { useFlag } from '@proton/unleash/useFlag';

import { getDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';

export const useLaunchDesktopAppOnLoad = () => {
    const meetOpenLinksInDesktopApp = useFlag('MeetOpenLinksInDesktopApp');
    const meetingLink = useMeetSelector(selectMeetingLink);

    const [launchedOnLoad] = useState(() => meetOpenLinksInDesktopApp && getDesktopAppPreference());

    useEffect(() => {
        if (launchedOnLoad) {
            tryOpenInDesktopApp(meetingLink);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return launchedOnLoad;
};
