import { PLANS, isTrial } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';

interface Props {
    subscription: MaybeFreeSubscription;
}

export const getIsEligible = ({ subscription }: Props) => {
    return isTrial(subscription, PLANS.MAIL);
};
