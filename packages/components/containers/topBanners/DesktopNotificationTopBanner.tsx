import { useState, useRef, useLayoutEffect } from 'react';
import { c } from 'ttag';
import { getStatus, request, Status } from '@proton/shared/lib/helpers/desktopNotification';
import { APP_NAMES, APPS } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { UserSettings } from '@proton/shared/lib/interfaces';

import TopBanner from './TopBanner';
import { useLocalState, useConfig, useUserSettings } from '../../hooks';

const DesktopNotificationTopBanner = () => {
    const [status, setStatus] = useState<Status>(getStatus());
    const [dontAsk, setDontAsk] = useLocalState(false, 'dont-ask-desktop-notification');
    const { APP_NAME } = useConfig();
    const onMobile = useRef(isMobile());
    const [userSettings] = useUserSettings();

    const initialUserSettings = useRef<UserSettings>();

    const { AppWelcome = {} } = initialUserSettings.current || {};
    const { Calendar = [], Mail = [] } = AppWelcome;

    // We don't want to display this banner to a new user on the first use, we are waiting for a refresh to do it
    const hasSeenAppBefore =
        APP_NAME === APPS.PROTONMAIL ? !!Mail.length : APP_NAME === APPS.PROTONCALENDAR ? !!Calendar.length : false;
    const canShowBanner = !!initialUserSettings && hasSeenAppBefore;

    useLayoutEffect(() => {
        if (!initialUserSettings.current && userSettings) {
            initialUserSettings.current = userSettings;
        }
    }, [userSettings]);

    if (onMobile.current) {
        // NOTE: we could support mobile notification but this require to run a service worker
        return null;
    }

    const appName = getAppName(APP_NAME);

    if (!([APPS.PROTONMAIL, APPS.PROTONCALENDAR] as APP_NAMES[]).includes(APP_NAME)) {
        return null;
    }

    if (dontAsk) {
        return null;
    }

    if ([Status.GRANTED, Status.DENIED].includes(status)) {
        return null;
    }

    if (!canShowBanner) {
        return null;
    }

    const handleEnable = () => {
        request(
            () => setStatus(getStatus()),
            () => setStatus(getStatus())
        );
    };

    const enableDesktopNotifications = (
        <button
            key="enable-desktop-notifications"
            className="link align-baseline text-left"
            type="button"
            onClick={handleEnable}
        >
            {c('Action').t`enable desktop notifications`}
        </button>
    );

    return (
        <TopBanner onClose={() => setDontAsk(true)} className="bg-info">{c('Info')
            .jt`${appName} needs your permission to ${enableDesktopNotifications}.`}</TopBanner>
    );
};

export default DesktopNotificationTopBanner;
