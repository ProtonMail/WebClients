import { addDays, fromUnixTime, getUnixTime, isAfter, isBefore } from 'date-fns';
import { c } from 'ttag';

import useAssistantTelemetry from '@proton/llm/lib/useAssistantTelemetry';
import { hasAIAssistant } from '@proton/shared/lib/helpers/subscription';

import { FeatureCode, useOrganization } from '../..';
import useFeature from '../useFeature';
import useNotifications from '../useNotifications';
import useSubscription from '../useSubscription';
import useUser from '../useUser';

export const ASSISTANT_TRIAL_TIME_DAYS = 14;

export type TrialStatus = 'trial-ongoing' | 'trial-ended' | 'trial-not-started' | 'is-paid';

const useAssistantSubscriptionStatus = () => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    const { createNotification } = useNotifications();
    const { sendFreeTrialStart } = useAssistantTelemetry();
    const nowDate = new Date();

    const hasAiAssistantAddon = hasAIAssistant(subscription);
    // B2B admins and sub users has AI without requiring a subscription
    const userHasAI = organization && !!user.NumAI;

    const trialStartDateFeat = useFeature(FeatureCode.ComposerAssistantTrialStartDate);
    const trialStartDate =
        trialStartDateFeat.feature?.Value && typeof trialStartDateFeat.feature?.Value === 'number'
            ? fromUnixTime(trialStartDateFeat.feature?.Value)
            : null;

    const endDate = trialStartDate ? addDays(trialStartDate, ASSISTANT_TRIAL_TIME_DAYS) : null;

    const trialStatus: TrialStatus = (() => {
        if (hasAiAssistantAddon || userHasAI) {
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
        if (!trialStartDate && !hasAiAssistantAddon) {
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
