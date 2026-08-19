import { useEffect, useState } from 'react';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';

import { getDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';

export const useDesktopAppRedirect = ({ token, isInstantJoin }: { token: string; isInstantJoin: boolean }) => {
    const meetOpenLinksInDesktopApp = useFlag('MeetOpenLinksInDesktopApp');

    const shareLink = useMeetSelector(selectMeetingLink);

    const [openedInDesktopApp] = useState(
        () => meetOpenLinksInDesktopApp && getDesktopAppPreference() && !!token && !isInstantJoin && !isElectronApp
    );

    useEffect(() => {
        if (openedInDesktopApp) {
            tryOpenInDesktopApp(shareLink);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { openedInDesktopApp };
};
