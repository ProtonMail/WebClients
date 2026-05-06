import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryUpgradePageEvents } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

type Cta = 'select_plan' | 'view_plans_details';

interface Props {
    app: APP_NAMES;
}

export const usePlansSectionTelemetry = ({ app }: Props) => {
    const api = useApi();

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountUpgradePage,
        delay: false,
    };

    const commonDimensions = { app };

    const sendPageLoad = useCallback(() => {
        void sendTelemetryReport({
            ...commonProps,
            event: TelemetryUpgradePageEvents.page_load,
            dimensions: { ...commonDimensions },
        });
    }, [api]);

    const sendCtaClick = useCallback(
        ({ cta, plan }: { cta: Cta; plan?: string }) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryUpgradePageEvents.cta_click,
                dimensions: { ...commonDimensions, cta, plan: plan ?? 'unknown' },
            });
        },
        [api]
    );

    const sendSubscriptionSuccess = useCallback(
        ({ origin, plan }: { origin: Cta; plan?: string }) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryUpgradePageEvents.subscription_success,
                dimensions: { ...commonDimensions, origin, plan: plan ?? 'unknown' },
            });
            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    return { sendPageLoad, sendCtaClick, sendSubscriptionSuccess };
};
