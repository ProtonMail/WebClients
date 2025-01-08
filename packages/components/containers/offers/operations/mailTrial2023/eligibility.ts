import { PLANS } from '@proton/payments';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import type { Subscription } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
}

export const getIsEligible = ({ subscription }: Props) => {
    return isTrial(subscription, PLANS.MAIL);
};
