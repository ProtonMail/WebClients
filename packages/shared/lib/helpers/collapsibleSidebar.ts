import type { RefObject } from 'react';
import { useEffect } from 'react';
import { useState } from 'react';

import { TelemetryCollapsibleLeftSidebarEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import type { APP_NAMES } from '../constants';
import type { Api } from '../interfaces';

export const enum COLLAPSE_EVENTS {
    COLLAPSE = 'COLLAPSE',
    EXPAND = 'EXPAND',
}
export const enum SOURCE_EVENT {
    BUTTON_SIDEBAR = 'BUTTON_SIDEBAR',
    BUTTON_FOLDERS = 'BUTTON_FOLDERS',
    BUTTON_LABELS = 'BUTTON_LABELS',
}

export const sendRequestCollapsibleSidebarReport = ({
    api,
    action,
    application,
    sourceEvent,
}: {
    api: Api;
    action: COLLAPSE_EVENTS;
    application: APP_NAMES;
    sourceEvent: SOURCE_EVENT;
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
