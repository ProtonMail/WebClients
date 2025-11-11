import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import { CYCLE, type FreeSubscription, type Subscription, isManagedExternally } from '@proton/payments';
import type { UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription | FreeSubscription;
    user: UserModel;
}
const PlanPriceElement = ({ subscription, user }: Props) => {
    const cycle = subscription?.Cycle ?? CYCLE.MONTHLY;
    const amount = (subscription?.Amount ?? 0) / cycle;

    return (
        (user.hasPaidMail || user.hasPaidVpn || user.hasPaidPass) &&
        !isManagedExternally(subscription) && (
            <Price
                currency={subscription?.Currency}
                suffix={subscription && amount ? c('Suffix').t`/month` : ''}
                wrapperClassName="text-semibold"
                currencyClassName="text-5xl color-norm"
                amountClassName="text-5xl color-norm"
                data-testid="plan-price"
            >
                {amount}
            </Price>
        )
    );
};

export default PlanPriceElement;
