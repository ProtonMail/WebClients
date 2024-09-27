import { addDays, fromUnixTime, getUnixTime, isAfter, isBefore } from 'date-fns';
import { c } from 'ttag';

import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { FeatureCode, useFeature } from '@proton/features';

import useNotifications from '../useNotifications';
import useUser from '../useUser';

export const ASSISTANT_TRIAL_TIME_DAYS = 14;

export type TrialStatus = 'trial-ongoing' | 'trial-ended' | 'trial-not-started' | 'is-paid' | 'no-trial';

// Prevent multiple starts in case of multiple start calls
let started = false;

export interface AssistantSubscriptionStatus {
    canUseAssistant: boolean;
    trialEndDate: Date | null;
    trialStatus: TrialStatus;
    start: () => void;
}

const useAssistantSubscriptionStatus = (): AssistantSubscriptionStatus => {
    const [user] = useUser();
    const { createNotification } = useNotifications();
    const { sendFreeTrialStart } = useAssistantTelemetry();
    const nowDate = new Date();

    const hasAiAssistantAddon = !!user.NumAI;
    const trialStartDateFeat = useFeature(FeatureCode.ComposerAssistantTrialStartDate);
    const trialStartDate =
        trialStartDateFeat.feature?.Value && typeof trialStartDateFeat.feature?.Value === 'number'
            ? fromUnixTime(trialStartDateFeat.feature?.Value)
            : null;

    const endDate = trialStartDate ? addDays(trialStartDate, ASSISTANT_TRIAL_TIME_DAYS) : null;

    const trialStatus: TrialStatus = (() => {
        // Free users have no trial period
        if (user.isFree) {
            return 'no-trial';
        }

        if (hasAiAssistantAddon) {
            return 'is-paid';
        }

        if (endDate && isBefore(nowDate, endDate)) {
            return 'trial-ongoing';
        }

        if (endDate && isAfter(nowDate, endDate)) {
            return 'trial-ended';
        }

        return 'trial-not-started';
    })();

    const start = async () => {
        if (!started && !trialStartDate && !hasAiAssistantAddon) {
            started = true;
            await trialStartDateFeat.update(getUnixTime(new Date()));
            createNotification({
                text: c('Notification').t`Trial started`,
            });
            sendFreeTrialStart();
        }
    };

    return {
        canUseAssistant: hasAiAssistantAddon && trialStatus !== 'trial-ended' && trialStatus !== 'no-trial',
        trialEndDate: endDate,
        trialStatus,
        start,
    };
};

export default useAssistantSubscriptionStatus;
