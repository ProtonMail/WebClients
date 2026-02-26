import type { Subscription } from '@proton/payments';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import type { OfferConfig } from '../../interface';

export function getIsEligible(_props: {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}) {
    return false;
}
