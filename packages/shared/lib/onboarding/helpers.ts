import { fromUnixTime, isBefore } from 'date-fns';

import { addDays } from '../date-fns-utc';
import type { MaybeFreeSubscription } from '../payments/subscription/interface';
import { isPaidSubscription } from '../payments/type-guards';
import { B2B_ONBOARDING_SHOW_BUTTON_INTERVAL } from './constants';

export const canShowB2BOnboardingButton = (subscription: MaybeFreeSubscription) => {
    const subscriptionStart = isPaidSubscription(subscription) ? fromUnixTime(subscription.CreateTime) : 0;
    const hideB2bOnboardingDate = subscriptionStart
        ? addDays(subscriptionStart, B2B_ONBOARDING_SHOW_BUTTON_INTERVAL)
        : null;
    return !!hideB2bOnboardingDate && isBefore(new Date(), hideB2bOnboardingDate);
};
