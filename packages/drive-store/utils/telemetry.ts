import createApi from '@proton/shared/lib/api/createApi';
import { TelemetryDriveWebFeature, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import config from '../config';
import { getLastActivePersistedUserSession } from './lastActivePersistedUserSession';

/**
 * At the present time, these metrics will only work when user is authenticated
 */
export enum Actions {
    AddToBookmark = 'addToBookmark',
}

const apiInstance = createApi({ config, sendLocaleHeaders: true });

export const countActionWithTelemetry = (action: Actions, count: number = 1) => {
    const persistedSession = getLastActivePersistedUserSession();

    if (persistedSession?.UID) {
        // API calls will now be Authenticated with x-pm-uid header
        apiInstance.UID = persistedSession?.UID;
    }

    return sendTelemetryReport({
        api: apiInstance,
        measurementGroup: TelemetryMeasurementGroups.driveWebActions,
        event: TelemetryDriveWebFeature.actions,
        values: {
            count,
        },
        dimensions: {
            name: action,
        },
        delay: false,
    });
};
