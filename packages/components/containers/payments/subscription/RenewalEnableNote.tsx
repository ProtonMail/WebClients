import { c } from 'ttag';

import type { Subscription } from '@proton/payments';
import type { CheckoutModifiers } from '@proton/payments';

import { subscriptionExpires } from './helpers';

type Props = {
    subscription: Subscription | undefined;
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
