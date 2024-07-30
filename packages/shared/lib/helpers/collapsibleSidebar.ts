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
