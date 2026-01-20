import { useEffect } from 'react';

import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import useFlag from '@proton/unleash/useFlag';

import { tryOpenInDesktopApp } from '../utils/desktopAppDetector';

interface UseDesktopAppDetectionProps {
    token: string;
    isInstantMeeting: boolean;
    isInstantJoin: boolean;
}

export const useDesktopAppDetection = ({ token, isInstantMeeting, isInstantJoin }: UseDesktopAppDetectionProps) => {
    const openLinksInDesktopApp = useFlag('MeetOpenLinksInDesktopApp');
    useEffect(() => {
        const checkDesktopApp = async () => {
            // Skip if: already in electron, no token (instant meeting), or instant join mode
            if (isElectronApp || !token || isInstantMeeting || isInstantJoin || !openLinksInDesktopApp || isMobile()) {
                return;
            }

            tryOpenInDesktopApp(window.location.href);
        };

        void checkDesktopApp();
    }, []);
};
