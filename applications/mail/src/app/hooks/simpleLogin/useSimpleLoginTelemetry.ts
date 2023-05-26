import { useApi, useSubscription } from '@proton/components/hooks';
import { TelemetryMeasurementGroups, TelemetrySimpleLoginEvents } from '@proton/shared/lib/api/telemetry';
import { APPS, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import { getPrimaryPlan } from '@proton/shared/lib/helpers/subscription';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';

export const useSimpleLoginTelemetry = () => {
    const api = useApi();
    const [subscription] = useSubscription();
    const primaryPlan = getPrimaryPlan(subscription, APPS.PROTONMAIL);
    const planTitle = primaryPlan?.Title || PLAN_NAMES[FREE_PLAN.Name as PLANS];

    // However, we need to bin the number of message we send to Telemetry
    // '0' => User has 0 messages in spam
    // '1' => User has 1 message in spam
    // '10' => User has 2-10 messages in spam
    // '10+' => User has more than 10 messages in spam
    const getBinnedMessagesInSpam = (totalMessages: number) => {
        if (totalMessages === 0) {
            return '0';
        } else if (totalMessages === 1) {
            return '1';
        } else if (totalMessages < 11) {
            return '10';
        } else {
            return '10+';
        }
    };

    const handleSendTelemetryData = (
        event: TelemetrySimpleLoginEvents,
        values?: SimpleMap<number>,
        needsModalType = false,
        messagesInSpam?: number
    ) => {
        const dimensions = {
            Plan: planTitle,
        } as SimpleMap<string>;

        if (needsModalType) {
            dimensions.ModalType = isSafari() ? 'website' : 'extension';
        }

        if (messagesInSpam !== undefined) {
            dimensions.MessagesInSpam = getBinnedMessagesInSpam(messagesInSpam);
        }

        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.mailSimpleLogin,
            event,
            values,
            dimensions,
        });
    };

    return { handleSendTelemetryData };
};
