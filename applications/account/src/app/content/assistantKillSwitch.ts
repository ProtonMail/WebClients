import { hasAIAssistant } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';

export const getAssistantKillSwitch = ({
    isInAllowedApps,
    subscriptions,
}: {
    isInAllowedApps: boolean;
    subscriptions: Subscription[];
}) => {
    if (!isInAllowedApps) {
        return true;
    }

    return !subscriptions.some(hasAIAssistant);
};
