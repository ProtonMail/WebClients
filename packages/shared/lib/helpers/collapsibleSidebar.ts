import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

import { TelemetryCollapsibleLeftSidebarEvents, TelemetryMeasurementGroups } from '../api/telemetry';
import type { APP_NAMES } from '../constants';
import type { Api } from '../interfaces';
import { sendTelemetryReport } from './metrics';

export const enum COLLAPSE_EVENTS {
    COLLAPSE = 'COLLAPSE',
    EXPAND = 'EXPAND',
}
export const enum SOURCE_EVENT {
    BUTTON_SIDEBAR = 'BUTTON_SIDEBAR',
    BUTTON_FOLDERS = 'BUTTON_FOLDERS',
    BUTTON_LABELS = 'BUTTON_LABELS',
    BUTTON_VIEWS = 'BUTTON_VIEWS',
    BUTTON_BOOKINGS = 'BUTTON_BOOKINGS',
    BUTTON_CALENDARS = 'BUTTON_CALENDARS',
}

export const sendRequestCollapsibleSidebarReport = ({
    api,
    action,
    application,
    sourceEvent,
    delay = false,
}: {
    api: Api;
    action: COLLAPSE_EVENTS;
    application: APP_NAMES;
    sourceEvent: SOURCE_EVENT;
    delay?: boolean;
}) => {
    void sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.collapsibleLeftSidebar,
        event: TelemetryCollapsibleLeftSidebarEvents.toggleLeftSidebar,
        dimensions: {
            action,
            application,
            sourceEvent,
        },
        delay,
    });
};

interface Props {
    navigationRef: RefObject<HTMLElement>;
}

const checkIsScrollPresent = ({ navigationRef }: Props) => {
    if (!navigationRef?.current) {
        return false;
    }

    const navigationScrollHeight = navigationRef.current.scrollHeight;
    const navigationClientHeight = navigationRef.current.clientHeight;

    return navigationClientHeight !== navigationScrollHeight;
};

export const useLeftSidebarButton = ({ navigationRef }: Props) => {
    const [isScrollPresent, setIsScrollPresent] = useState(false);

    useEffect(() => {
        const intervalID = window.setInterval(() => {
            setIsScrollPresent(checkIsScrollPresent({ navigationRef }));
        }, 350); // we'll optimize with observers later

        return () => {
            clearInterval(intervalID);
        };
    }, []);

    return { isScrollPresent };
};
