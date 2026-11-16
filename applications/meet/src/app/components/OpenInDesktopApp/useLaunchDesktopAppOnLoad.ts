import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';

import { getDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { useDesktopAppPreferenceStorageKey } from './useDesktopAppPreferenceStorageKey';

export const useLaunchDesktopAppOnLoad = () => {
    const meetingLink = useMeetSelector(selectMeetingLink);
    const desktopAppPreferenceStorageKey = useDesktopAppPreferenceStorageKey();

    const [launchedOnLoad] = useState(() => getDesktopAppPreference(desktopAppPreferenceStorageKey));

    useEffect(() => {
        if (launchedOnLoad) {
            tryOpenInDesktopApp(meetingLink);
        }
    }, [launchedOnLoad, meetingLink]);
};
