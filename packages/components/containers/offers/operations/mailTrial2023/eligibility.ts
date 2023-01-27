import { isTrial } from '@proton/shared/lib/helpers/subscription';
import { Subscription } from '@proton/shared/lib/interfaces';

interface Props {
    subscription?: Subscription;
}

const isEligible = ({ subscription }: Props) => {
    return isTrial(subscription);
};

export default isEligible;
