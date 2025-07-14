import { c } from 'ttag';

import { type FreeSubscription, type Subscription, getPlanTitle, isTrial } from '@proton/payments';
import { useOrganization } from '@proton/account/organization/hooks';
import { useIsB2BTrial } from '@proton/payments/ui';

interface Props {
    subscription: Subscription | FreeSubscription | undefined;
    hasPaymentMethod: boolean;
    taxCountry: React.ReactNode;
}

export const NoPaymentRequiredNote = ({ subscription, hasPaymentMethod, taxCountry }: Props) => {
    const [organization] = useOrganization();
    const trial = isTrial(subscription);
    const planTitle = getPlanTitle(subscription);

    const isB2BTrial = useIsB2BTrial(subscription, organization);

    if (isB2BTrial) {
        return null;
    }

    return (
        <div>
            {!trial && (
                <>
                    {taxCountry}
                    <div className="mb-4">{c('Info').t`No payment is required at this time.`}</div>
                </>
            )}
            {trial && !hasPaymentMethod && (
                <div className="mb-4">
                    {c('Info')
                        .t`You have a trial ${planTitle} subscription. If you would like to continue your subscription after the trial period, please add a payment method.`}
                </div>
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
