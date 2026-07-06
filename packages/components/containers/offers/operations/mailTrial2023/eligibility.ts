import { PLANS } from '@proton/payments/core/constants';
import { type MaybeFreeSubscription, isTrial } from '@proton/payments/core/subscription/helpers';

interface Props {
    subscription: MaybeFreeSubscription;
}

export const getIsEligible = ({ subscription }: Props) => {
    return isTrial(subscription, PLANS.MAIL);
};
