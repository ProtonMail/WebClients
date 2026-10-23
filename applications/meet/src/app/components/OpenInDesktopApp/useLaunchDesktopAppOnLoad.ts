import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { useFlag } from '@proton/unleash/useFlag';

import { getDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { useDesktopAppPreferenceStorageKey } from './useDesktopAppPreferenceStorageKey';

export const useLaunchDesktopAppOnLoad = () => {
    const meetOpenLinksInDesktopApp = useFlag('MeetOpenLinksInDesktopApp');
    const meetingLink = useMeetSelector(selectMeetingLink);
    const desktopAppPreferenceStorageKey = useDesktopAppPreferenceStorageKey();

    const [launchedOnLoad] = useState(
        () => meetOpenLinksInDesktopApp && getDesktopAppPreference(desktopAppPreferenceStorageKey)
    );

    useEffect(() => {
        if (launchedOnLoad) {
            tryOpenInDesktopApp(meetingLink);
        }
    }, [launchedOnLoad, meetingLink]);

    return launchedOnLoad;
};
