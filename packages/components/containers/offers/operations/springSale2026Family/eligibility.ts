import type { Currency, Subscription } from '@proton/payments';
import type { UserModel } from '@proton/shared/lib/interfaces';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

export function getIsEligible({
    user,
    subscription,
    offerConfig,
    preferredCurrency,
}: {
    user: UserModel;
    subscription?: Subscription;
    offerConfig: OfferConfig;
    preferredCurrency: Currency;
}) {
    if (user.isDelinquent || !user.canPay || !subscription || !isSubscriptionCheckAllowed(subscription, offerConfig)) {
        return false;
    }

    if (!isEligibleCurrency(preferredCurrency)) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);
    if (offerSubscription.isManagedExternally()) {
        // Exclude mobile
        return false;
    }
    const isDuo = offerSubscription.hasDuo();
    const notVisionary = !offerSubscription.hasVisionary();
    const notUsedCurrentPromo = !offerSubscription.usedSpringSale2026();
    const hasMonthlyFamilyPlan = offerSubscription.hasFamily() && offerSubscription.hasMonthlyCycle();

    if (
        user.isPaid &&
        (isDuo || hasMonthlyFamilyPlan) &&
        notVisionary &&
        notUsedCurrentPromo &&
        !offerSubscription.isManagedExternally()
    ) {
        return true;
    }

    return false;
}
