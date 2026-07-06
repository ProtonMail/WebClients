import { c } from 'ttag';

import type { CheckoutModifiers } from '@proton/payments/core/checkout-modifiers';
import type { FreeSubscription } from '@proton/payments/core/interface';
import { subscriptionExpires } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';

type Props = {
    subscription: Subscription | FreeSubscription | undefined;
} & CheckoutModifiers;

export const RenewalEnableNote = ({ subscription, isScheduledChargedImmediately, isScheduledChargedLater }: Props) => {
    // todo: check if we can display it on ANY subscription modification.
    const subscriptionWillRenewIfChanged = isScheduledChargedImmediately || isScheduledChargedLater;
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
