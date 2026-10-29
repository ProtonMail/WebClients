import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCross } from '@proton/icons/icons/IcCross';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import { canOpenInDesktopApp } from '../../utils/desktopAppDetector';

import './OpenDesktopAppBanner.scss';

const DOWNLOAD_URL = 'https://proton.me/meet/download';

export const OpenDesktopAppBanner = () => {
    const [visible, setVisible] = useState(canOpenInDesktopApp);

    if (!visible) {
        return null;
    }

    const protonMeet = (
        <span key="proton-meet-desktop-app" className="color-norm">
            {MEET_APP_NAME}
        </span>
    );

    const handleDownloadApp = () => {
        sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_clicked, { action: 'download' });
        window.open(DOWNLOAD_URL, '_blank');
    };

    return (
        <div
            className="open-desktop-app-banner w-full py-4 px-2 grid items-center shrink-0"
            style={{ gridTemplateColumns: 'auto 1fr auto' }}
        >
            <div />
            <div className="flex flex-column md:flex-row items-center justify-center gap-4 ml-5">
                <div className="color-weak text-semibold text-xs md:text-rg">
                    {
                        // translator: full sentence is "Get the best experience with the Proton Meet desktop app" where "Proton Meet" is emphasized in white color
                        c('Info').jt`Get the best experience with the ${protonMeet} desktop app`
                    }
                </div>
                <Button className="primary rounded-full" onClick={handleDownloadApp}>
                    {c('Action').t`Download app`}
                    <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
                </Button>
            </div>
            <button
                onClick={() => setVisible(false)}
                aria-label={c('Action').t`Close`}
                className="ml-2 mr-4 cursor-pointer"
            >
                <IcCross className="color-weak" size={5} alt={c('Action').t`Close`} />
            </button>
        </div>
    );
};
