import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { DAY, MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';

import { canShowBanner } from '../../utils/canShowBanner';
import { getDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';

import './OpenDesktopAppBanner.scss';

const STORAGE_KEY = 'open_desktop_app_banner_dismissed_until';
const DISMISS_DAYS = 30;

interface OpenDesktopAppBannerProps {
    meetingLink: string;
}

export const OpenDesktopAppBanner = ({ meetingLink }: OpenDesktopAppBannerProps) => {
    const meetDesktopAppBannerEnabled = useFlag('MeetDesktopAppBannerEnabled');
    const [visible, setVisible] = useState(
        () => !isElectronApp && canShowBanner(STORAGE_KEY) && !getDesktopAppPreference() && meetDesktopAppBannerEnabled
    );

    const downloadDesktopAppEnabled = useFlag('MeetDownloadDesktopAppEnabled');

    const dismiss = () => {
        const expiresAt = Date.now() + DISMISS_DAYS * DAY;

        try {
            localStorage.setItem(STORAGE_KEY, String(expiresAt));
        } catch {}

        setVisible(false);
    };

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
            className="open-desktop-app-banner w-full py-4 grid items-center"
            style={{ gridTemplateColumns: 'auto 1fr auto' }}
        >
            <div />
            <div className="flex items-center justify-center gap-3 ml-5">
                <div className="color-weak text-semibold text-xs md:text-rg">
                    {
                        // translator: full sentence is "Get the best experience with the Proton Meet desktop app" where "Proton Meet" is emphasized in white color
                        c('Info').jt`Get the best experience with the ${protonMeet} desktop app`
                    }
                </div>
                {downloadDesktopAppEnabled && (
                    <Button
                        className="open-desktop-app-banner-button action-button-new rounded-full bg-transparent"
                        onClick={handleDownloadApp}
                    >
                        {c('Action').t`Download app`}
                    </Button>
                )}
                <Button
                    className="open-desktop-app-banner-button action-button-new rounded-full bg-transparent"
                    onClick={() => {
                        tryOpenInDesktopApp(meetingLink);
                    }}
                >{c('Action').t`Open app`}</Button>
            </div>

            <button onClick={dismiss} aria-label={c('Action').t`Close`} className="ml-auto ml-4 mr-4 cursor-pointer">
                <IcCross className="color-hint" size={5} alt={c('Action').t`Close`} />
            </button>
        </div>
    );
};
