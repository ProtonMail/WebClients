import { useUser } from '@proton/account/user/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import type { BYOEAddressLimit } from '../helpers/byoeAddresses';
import { getBYOEAddressLimit } from '../helpers/byoeAddresses';
import useBYOEAddressesCounts from '../hooks/useBYOEAddressesCounts';
import useBYOEFeatureStatus from '../hooks/useBYOEFeatureStatus';

/**
 * Outcome of the BYOE gating check:
 * - `ok`: the user can add a BYOE address
 * - `no-access`: the user doesn't have access to the BYOE feature
 * - `feature-disabled`: the user has access, but BYOE creation is turned off by a kill switch
 * - `BYOEAddressLimit`: the user reached their address limit (see `getBYOEAddressLimit`)
 */
export type BYOEGatingOutcome = 'ok' | 'no-access' | 'feature-disabled' | BYOEAddressLimit;

/**
 * Gates the creation of BYOE addresses.
 * `checkGating` ensures that the feature is enabled and the user is within the limits of their plan.
 */
export const useBYOEGating = () => {
    const [user, loadingUser] = useUser();
    const [hasAccessToBYOE, loadingBYOEFeatureStatus] = useBYOEFeatureStatus();
    const { activeBYOEAddresses, isLoadingAddressesCount } = useBYOEAddressesCounts();

    const isInMaintenance = useFlag('MaintenanceImporter');
    const createBYOEDisabled = useFlag('CreateInboxBringYourOwnEmailDisabled');

    const isLoadingGating = loadingUser || loadingBYOEFeatureStatus || isLoadingAddressesCount;

    const checkGating = (): BYOEGatingOutcome => {
        if (hasAccessToBYOE && createBYOEDisabled) {
            return 'feature-disabled';
        }

        // Intentionally checked before `no-access`: the limits also apply to forwardings, so users
        // without BYOE access who reached the limit must still see the limit or upsell modal.
        const limit = getBYOEAddressLimit(user, activeBYOEAddresses.length);
        if (limit) {
            return limit;
        }
        return hasAccessToBYOE ? 'ok' : 'no-access';
    };

    return { hasAccessToBYOE, isLoadingGating, checkGating, isInMaintenance };
};
