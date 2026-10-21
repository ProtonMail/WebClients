import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { TelemetryMeetActionsEvents, sendMeetActionsEvent } from '@proton/meet/telemetry/meetTelemetry';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useSendOnce } from '../../telemetry/useSendOnce';
import { saveDesktopAppPreference, tryOpenInDesktopApp } from '../../utils/desktopAppDetector';
import { useLaunchDesktopAppOnLoad } from './useLaunchDesktopAppOnLoad';

import './OpenInDesktopApp.scss';

const DOWNLOAD_URL = 'https://proton.me/meet/download';

export const OpenInDesktopApp = () => {
    const meetingLink = useMeetSelector(selectMeetingLink);
    const launchedOnLoad = useLaunchDesktopAppOnLoad();
    const [isAppDidNotOpenHintVisible, setIsAppDidNotOpenHintVisible] = useState(launchedOnLoad);

    useSendOnce(() => sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_shown));

    const handleOpenInDesktopApp = () => {
        sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_clicked, { action: 'open_app' });
        tryOpenInDesktopApp(meetingLink);
        saveDesktopAppPreference();
        setIsAppDidNotOpenHintVisible(true);
    };

    const handleDownload = () => {
        sendMeetActionsEvent(TelemetryMeetActionsEvents.desktop_app_banner_clicked, { action: 'download' });
    };

    const downloadLink = (
        <Href key="download" href={DOWNLOAD_URL} onClick={handleDownload}>
            {c('Link').t`download`}
            <span className="sr-only">{c('Accessibility').t`(opens in new tab)`}</span>
        </Href>
    );

    return (
        <div className="relative w-full">
            <Button
                className="tertiary py-4 px-5 md:py-5 rounded-full"
                size="large"
                fullWidth
                onClick={handleOpenInDesktopApp}
            >
                {c('Action').t`Join from ${MEET_APP_NAME} app`}
            </Button>
            {isAppDidNotOpenHintVisible && (
                <div aria-live="polite" className="open-in-desktop-app-hint absolute w-full mt-3 p-4 text-center">
                    <CloseButton
                        className="absolute top-0 right-0 mt-2 mr-2"
                        style={{ '--w-custom': '1.75rem', '--h-custom': '1.75rem' }}
                        onClose={() => setIsAppDidNotOpenHintVisible(false)}
                    />
                    <p className="m-0 text-semibold">{c('Info').t`App didn't open?`}</p>
                    <p className="m-0 mt-2 text-sm color-weak">
                        {c('Info')
                            .jt`Please ${downloadLink} and install the app, then click Join in the ${MEET_APP_NAME} app again.`}
                    </p>
                </div>
            )}
        </div>
    );
};
