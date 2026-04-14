import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { saveDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';

import './OpenDesktopAppBanner.scss';

const STORAGE_KEY = 'open_desktop_app_banner_dismissed_until';
const OPEN_DESKTOP_APP_STORAGE_KEY = 'open_desktop_app_storage_key';

interface OpenDesktopAppBannerProps {
    meetingLink: string;
}

export const OpenDesktopAppBanner = ({ meetingLink }: OpenDesktopAppBannerProps) => {
    const [visible] = useState(() => !isElectronApp);

    useEffect(() => {
        // Remove deprecated banner storage key
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(OPEN_DESKTOP_APP_STORAGE_KEY);
    }, []);

    if (!visible) {
        return null;
    }

    const protonMeet = (
        <span key="proton-meet-desktop-app" className="color-norm">
            {MEET_APP_NAME}
        </span>
    );

    const handleDownloadApp = () => {
        const protocolUrl = 'https://proton.me/meet/download';
        window.open(protocolUrl, '_blank');
    };

    return (
        <div
            className="open-desktop-app-banner w-full py-4 grid items-center shrink-0"
            style={{ gridTemplateColumns: 'auto 1fr auto' }}
        >
            <div />
            <div className="flex flex-column md:flex-row items-center justify-center gap-3 ml-5">
                <div className="color-weak text-semibold text-xs md:text-rg">
                    {
                        // translator: full sentence is "Get the best experience with the Proton Meet desktop app" where "Proton Meet" is emphasized in white color
                        c('Info').jt`Get the best experience with the ${protonMeet} desktop app`
                    }
                </div>
                <div>
                    <Button
                        className="open-desktop-app-banner-button action-button-new rounded-full bg-transparent"
                        onClick={handleDownloadApp}
                    >
                        {c('Action').t`Download app`}
                    </Button>
                    <Button
                        className="open-desktop-app-banner-button action-button-new rounded-full bg-transparent"
                        onClick={() => {
                            tryOpenInDesktopApp(meetingLink);
                            saveDesktopAppPreference(true);
                        }}
                    >{c('Action').t`Open app`}</Button>
                </div>
            </div>
        </div>
    );
};
