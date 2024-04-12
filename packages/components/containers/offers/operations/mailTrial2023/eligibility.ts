import { PLANS } from '@proton/shared/lib/constants';
import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { Subscription } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
}

const isEligible = ({ subscription }: Props) => {
    return isTrial(subscription, PLANS.MAIL);
};

export default isEligible;
