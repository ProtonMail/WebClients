import { c } from 'ttag';

import type { FreeSubscription } from '@proton/payments/core/interface';
import { getPlanTitle, isTrial } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';

interface Props {
    subscription: Subscription | FreeSubscription | undefined;
    hasPaymentMethod: boolean;
    taxFields: React.ReactNode;
}

export const NoPaymentRequiredNote = ({ subscription, hasPaymentMethod, taxFields }: Props) => {
    const trial = isTrial(subscription);
    const planTitle = getPlanTitle(subscription);

    return (
        <div>
            {!trial && <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>}
            {trial && !hasPaymentMethod && (
                <>
                    <div className="mb-4">
                        {c('Info')
                            .t`You have a trial ${planTitle} subscription. If you would like to continue your subscription after the trial period, please add a payment method.`}
                    </div>
                    {taxFields}
                </>
            )}
            {trial && hasPaymentMethod && (
                <div className="mb-4">
                    {c('Info')
                        .t`You have a trial ${planTitle} subscription. No payment is required at this time. Your subscription will be automatically renewed at the end of the trial period.`}
                </div>
            )}
        </div>
    );
};
