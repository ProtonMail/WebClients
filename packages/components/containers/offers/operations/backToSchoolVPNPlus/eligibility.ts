import type { Subscription } from '@proton/payments';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import type { OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const getIsEligible = ({ user, subscription, protonConfig, offerConfig }: Props) => {
    if (!subscription) {
        return false;
    }

    return false;
};
