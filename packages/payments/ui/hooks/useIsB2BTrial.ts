import type { Organization } from '@proton/shared/lib/interfaces';

import type { FreeSubscription } from '../../core/interface';
import { isTrial } from '../../core/subscription/helpers';
import type { Subscription } from '../../core/subscription/interface';

const useIsB2BTrial = (subscription?: Subscription | FreeSubscription, organization?: Organization): boolean => {
    return isTrial(subscription) && !!organization?.IsBusiness;
};

export default useIsB2BTrial;
