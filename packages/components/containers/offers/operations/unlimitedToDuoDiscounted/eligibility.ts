import { CYCLE } from '@proton/payments/core/constants';
import type { Currency } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

import { hasIntentionalScheduledModification } from '../../helpers/hasIntentionalScheduledModification';
import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';
import { getDaysSincePeriodStart, isInOfferWindow } from './offerWindow';

const ELIGIBLE_CYCLES: CYCLE[] = [CYCLE.YEARLY, CYCLE.TWO_YEARS];

const ELIGIBLE_APPS = new Set<APP_NAMES>([APPS.PROTONMAIL, APPS.PROTONCALENDAR, APPS.PROTONDRIVE]);

const isEligibleApp = (protonConfig: ProtonConfig, pathname: string): boolean => {
    const { APP_NAME } = protonConfig;

    if (APP_NAME === APPS.PROTONACCOUNT) {
        const parentApp = getAppFromPathnameSafe(pathname);

        return !!parentApp && ELIGIBLE_APPS.has(parentApp);
    }

    return ELIGIBLE_APPS.has(APP_NAME);
};

/**
 * Targets Unlimited subscribers on a yearly or two-yearly web plan who are approaching renewal,
 * offering Duo 12M at a discount. Runs in Mail, Calendar and Drive.
 */
export function getIsEligible({
    user,
    subscription,
    protonConfig,
    offerConfig,
    preferredCurrency,
    pathname,
}: {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
    preferredCurrency: Currency;
    pathname: string;
}) {
    if (user.isDelinquent || !user.canPay || !subscription || hasPassLifetime(user)) {
        return false;
    }

    // A user with a scheduled change has already decided what happens at renewal; don't cut across it.
    if (hasIntentionalScheduledModification(subscription)) {
        return false;
    }

    if (!isEligibleCurrency(preferredCurrency)) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);

    if (
        offerSubscription.isTrial() ||
        offerSubscription.isManagedExternally() ||
        offerSubscription.hasVisionary() ||
        !isSubscriptionCheckAllowed(subscription, offerConfig)
    ) {
        return false;
    }

    const cycle = offerSubscription.getCycle();

    if (!ELIGIBLE_CYCLES.includes(cycle)) {
        return false;
    }

    if (!isInOfferWindow(cycle, getDaysSincePeriodStart(subscription))) {
        return false;
    }

    return user.isPaid && offerSubscription.hasBundle() && isEligibleApp(protonConfig, pathname);
}
