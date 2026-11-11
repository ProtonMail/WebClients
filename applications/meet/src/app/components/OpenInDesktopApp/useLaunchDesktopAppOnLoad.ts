import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { useFlag } from '@proton/unleash/useFlag';

import {
    OPEN_LINKS_IN_DESKTOP_APP_FLAG,
    getDesktopAppPreference,
    tryOpenInDesktopApp,
} from '../../utils/desktopAppDetector';
import { useDesktopAppPreferenceStorageKey } from './useDesktopAppPreferenceStorageKey';

export const useLaunchDesktopAppOnLoad = () => {
    const meetOpenLinksInDesktopApp = useFlag(OPEN_LINKS_IN_DESKTOP_APP_FLAG);
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
