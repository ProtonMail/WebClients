import { useEffect, useId, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';

import { useSendOnce } from '../../telemetry/useSendOnce';
import { saveDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';

import './OpenInDesktopApp.scss';

const DOWNLOAD_URL = 'https://proton.me/meet/download';

export const OpenInDesktopAppLink = ({ onOpen }: { onOpen: () => void }) => {
    const meetingLink = useMeetSelector(selectMeetingLink);

    useSendOnce(() => sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_shown));

    const handleClick = () => {
        sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_clicked, { action: 'open_app' });
        tryOpenInDesktopApp(meetingLink);
        saveDesktopAppPreference();
        onOpen();
    };

    return (
        <button type="button" className="open-in-desktop-app-link self-center text-semibold" onClick={handleClick}>
            {c('Action').t`Open this meeting in the desktop app`}
        </button>
    );
};

export const OpenInDesktopAppCard = () => {
    const meetingLink = useMeetSelector(selectMeetingLink);
    const tryAgainRef = useRef<HTMLButtonElement>(null);
    const titleId = useId();

    useEffect(() => {
        tryAgainRef.current?.focus();
    }, []);

    const handleTryAgain = () => {
        sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_clicked, { action: 'retry' });
        tryOpenInDesktopApp(meetingLink);
    };

    const handleDownload = () => {
        sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_clicked, { action: 'download' });
        window.open(DOWNLOAD_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="open-in-desktop-app-card w-full flex flex-column flex-nowrap gap-3 p-4">
            <p id={titleId} className="open-in-desktop-app-card-title m-0 text-semibold text-center">
                {c('Info').t`App didn't open?`}
            </p>
            <div className="flex flex-nowrap gap-2 py-2">
                <Button
                    ref={tryAgainRef}
                    aria-describedby={titleId}
                    className="open-in-desktop-app-card-button tertiary rounded-full flex-1 text-semibold"
                    onClick={handleTryAgain}
                >
                    {c('Action').t`Try again`}
                </Button>
                <Button
                    className="open-in-desktop-app-card-button tertiary rounded-full flex-1 text-semibold"
                    onClick={handleDownload}
                >
                    {c('Action').t`Download app`}
                    <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
                </Button>
            </div>
            <p className="open-in-desktop-app-card-hint m-0 text-sm color-hint text-center">
                {c('Info').t`Already in the app? You can close this tab.`}
            </p>
        </div>
    );
};
