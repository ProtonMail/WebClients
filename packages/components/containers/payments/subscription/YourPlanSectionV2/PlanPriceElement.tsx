import { c } from 'ttag';

import { CYCLE } from '@proton/payments/core/constants';
import { isManagedExternally } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { UserModel } from '@proton/shared/lib/interfaces';

import Price from '../../../../components/price/Price';

interface Props {
    subscription: Subscription;
    user: UserModel;
}
const PlanPriceElement = ({ subscription }: Props) => {
    const cycle = subscription?.Cycle ?? CYCLE.MONTHLY;
    const amount = (subscription?.Amount ?? 0) / cycle;

    return (
        !isManagedExternally(subscription) && (
            <Price
                currency={subscription.Currency}
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
