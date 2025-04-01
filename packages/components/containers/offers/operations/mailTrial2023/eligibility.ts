import { PLANS, type Subscription } from '@proton/payments';
import { isTrial } from '@proton/shared/lib/helpers/subscription';

interface Props {
    subscription?: Subscription;
}

export const getIsEligible = ({ subscription }: Props) => {
    return isTrial(subscription, PLANS.MAIL);
};
