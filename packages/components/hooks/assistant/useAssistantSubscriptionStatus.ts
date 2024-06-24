import { addDays, fromUnixTime, getUnixTime, isAfter, isBefore } from 'date-fns';
import { c } from 'ttag';

import useAssistantTelemetry from '@proton/components/containers/llm/useAssistantTelemetry';

import { FeatureCode } from '../..';
import useFeature from '../useFeature';
import useNotifications from '../useNotifications';
import useUser from '../useUser';

export const ASSISTANT_TRIAL_TIME_DAYS = 30;

export type TrialStatus = 'trial-ongoing' | 'trial-ended' | 'trial-not-started' | 'is-paid';

// Prevent multiple starts in case of multiple start calls
let started = false;

const useAssistantSubscriptionStatus = () => {
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
        canUseAssistant: hasAiAssistantAddon && trialStatus !== 'trial-ended',
        trialEndDate: endDate,
        trialStatus,
        start,
    };
};

export default useAssistantSubscriptionStatus;
