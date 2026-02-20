import type { Organization } from '@proton/shared/lib/interfaces';

import type { FreeSubscription } from '../../core/interface';
import { isB2BTrial } from '../../core/subscription/helpers';
import type { Subscription } from '../../core/subscription/interface';

const useIsB2BTrial = (subscription?: Subscription | FreeSubscription, organization?: Organization): boolean => {
    return isB2BTrial(subscription, organization);
};

export default useIsB2BTrial;
