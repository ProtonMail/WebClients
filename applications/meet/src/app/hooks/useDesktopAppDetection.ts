import { useEffect } from 'react';

import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { tryOpenInDesktopApp } from '../utils/desktopAppDetector';

interface UseDesktopAppDetectionProps {
    token: string;
    isInstantMeeting: boolean;
    isInstantJoin: boolean;
}

export const useDesktopAppDetection = ({ token, isInstantMeeting, isInstantJoin }: UseDesktopAppDetectionProps) => {
    useEffect(() => {
        const checkDesktopApp = async () => {
            // Skip if: already in electron, no token (instant meeting), or instant join mode
            if (isElectronApp || !token || isInstantMeeting || isInstantJoin) {
                return;
            }

            await tryOpenInDesktopApp(window.location.href);
        };

        void checkDesktopApp();
    }, [token, isInstantMeeting, isInstantJoin]);
};
