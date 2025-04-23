import { PLANS, type Subscription } from '@proton/payments';
import { isTrial } from '@proton/payments';

interface Props {
    subscription?: Subscription;
}

export const getIsEligible = ({ subscription }: Props) => {
    return isTrial(subscription, PLANS.MAIL);
};
