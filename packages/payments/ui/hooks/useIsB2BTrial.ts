import type { Organization } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/index';

import { isTrial } from '../../core/subscription/helpers';
import type { Subscription } from '../../core/subscription/interface';
import type { FreeSubscription } from '../../core/interface';

const useIsB2BTrial = (subscription?: Subscription | FreeSubscription, organization?: Organization): boolean => {
    const isB2BTrialEnabled = useFlag('ManualTrialsFE');
    return isTrial(subscription) && !!organization?.IsBusiness && isB2BTrialEnabled;
};

export default useIsB2BTrial;
