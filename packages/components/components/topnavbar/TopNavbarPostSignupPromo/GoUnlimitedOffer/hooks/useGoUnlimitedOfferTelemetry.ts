import { useUserSettings } from '@proton/account';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import type { TelemetryUnlimitedOffer2025 } from '@proton/shared/lib/api/telemetry';
import { type TelemetryEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';
import { type SimpleMap } from '@proton/shared/lib/interfaces';

import type { MessageType } from '../helpers/interface';

export const useGoUnlimitedOfferTelemetry = (app: APP_NAMES) => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryEvents, dimensions?: SimpleMap<string>) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.unlimitedOffer2025,
            event,
            dimensions,
            delay: false,
        });
    };

    const sendTelemetryReportGoUnlimited2025 = (action: TelemetryUnlimitedOffer2025, type: MessageType) => {
        sendReport(action, {
            appName: app,
            messageType: type,
        });
    };

    return {
        sendTelemetryReportGoUnlimited2025,
    };
};
