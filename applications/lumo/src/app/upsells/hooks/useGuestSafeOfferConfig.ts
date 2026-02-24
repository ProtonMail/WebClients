import { useMemo } from 'react';

import useOfferConfig from '@proton/components/containers/offers/hooks/useOfferConfig';
import type { OfferConfig } from '@proton/components/containers/offers/interface';

import { useIsGuest } from '../../providers/IsGuestProvider';

/**
 * Guest-safe wrapper for useOfferConfig that handles guest users gracefully.
 *
 * This approach uses conditional hook calling which is acceptable here because
 * the guest status is determined at app initialization and never changes during
 * the component lifecycle.
 */
const useGuestSafeOfferConfig = (): [OfferConfig | undefined, boolean] => {
    const isGuest = useIsGuest();

    const guestResult = useMemo((): [OfferConfig | undefined, boolean] => [undefined, false], []);

    // For guest users, return no offer config immediately
    // This prevents any offer-related API calls that would fail
    if (isGuest) {
        return guestResult;
    }

    // For authenticated users, call the normal offer config hook
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useOfferConfig();
};

export default useGuestSafeOfferConfig;
