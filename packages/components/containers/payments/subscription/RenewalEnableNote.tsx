import { c } from 'ttag';

import { SubscriptionModel } from '@proton/shared/lib/interfaces';

import { subscriptionExpires } from './helpers';
import { CheckoutModifiers } from './useCheckoutModifiers';

type Props = {
    subscription: SubscriptionModel | undefined;
} & CheckoutModifiers;

export const RenewalEnableNote = ({ subscription, isScheduledSubscription, isAddonDowngrade }: Props) => {
    // todo: check if we can display it on ANY subscription modification.
    const subscriptionWillRenewIfChanged = isScheduledSubscription || isAddonDowngrade;
    const { renewDisabled } = subscriptionExpires(subscription);

    const displayNote = !!subscription && renewDisabled && subscriptionWillRenewIfChanged;

    if (!displayNote) {
        return null;
    }

    return (
        <div className="mb-4">
            <p>
                {c('Payments')
                    .t`Currently the automatic renewal of subscription is disabled. If you change the subscription now, then the automatic renewal will be re-enabled.`}
            </p>
        </div>
    );
};
