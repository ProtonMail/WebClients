import { useApi, useSubscription, useUser } from '@proton/components/hooks';
import { getPrimaryPlan } from '@proton/shared/lib/helpers/subscription';
import { APPS, PLAN_NAMES, PLANS } from '@proton/shared/lib/constants';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { TelemetryMeasurementGroups, TelemetrySimpleLoginEvents } from '@proton/shared/lib/api/telemetry';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

export const useSimpleLoginTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const primaryPlan = getPrimaryPlan(subscription, APPS.PROTONMAIL);
    const planTitle = primaryPlan?.Title || PLAN_NAMES[FREE_PLAN.Name as PLANS];

    const handleSendTelemetryData = (
        event: TelemetrySimpleLoginEvents,
        values?: SimpleMap<number>,
        needsModalType = false
    ) => {
        const dimensions = {
            Uid: user.ID,
            Plan: planTitle,
        } as SimpleMap<string>;

        if (needsModalType) {
            dimensions.ModalType = isSafari() ? 'website' : 'extension';
        }

        void sendTelemetryReport(api, TelemetryMeasurementGroups.mailSimpleLogin, event, values, dimensions);
    };

    return { handleSendTelemetryData };
};
