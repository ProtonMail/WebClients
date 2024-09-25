import { useCallback, useMemo, useState } from 'react';

import useEarlyAccess from '@proton/components/hooks/useEarlyAccess';
import useUser from '@proton/components/hooks/useUser';
import { type FeatureCode, useFeature } from '@proton/features';
import { SECOND } from '@proton/shared/lib/constants';
import { getEnvironmentDate } from '@proton/shared/lib/spotlight/helpers';
import type { SpotlightDate } from '@proton/shared/lib/spotlight/interface';

/**
 * This hook is used to leverage from our FeatureFlag system in order to display only once the spotlight to the user.
 * When/if the spotlight is getting displayed, `onDisplayed` callback should be called in order to turn the feature flag off.
 * Obviously, an additional FF should used rather than the highlighted feature's one itself
 *
 * @dev Pass releaseDates if you want to hide the spotlight for users created after the release date
 * @dev Pass expiration if you want to stop showing the spotlight after a certain date
 */
const useSpotlightOnFeature = (
    code: FeatureCode,
    initialShow = true,
    releaseDates?: SpotlightDate,
    expirationDates?: SpotlightDate
) => {
    const [manualClose, setManualClose] = useState(false);
    const { feature, update, loading: loadingFeature } = useFeature(code);
    const [user, loadingUser] = useUser();
    const { currentEnvironment, loading: loadingCurrentEnvironment } = useEarlyAccess();

    const loading = loadingFeature || loadingUser || !user || loadingCurrentEnvironment;

    // If the feature flag value is changing right after the spotlight is displayed, we don't want it to be closed automatically
    const show = useMemo(() => {
        // Stop showing the spotlight after the expiration date
        if (expirationDates) {
            const expirationDate = getEnvironmentDate(currentEnvironment, expirationDates);
            if (Date.now() > expirationDate) {
                return false;
            }
        }

        const hideBecauseIsNewUser = releaseDates
            ? user.CreateTime * SECOND > getEnvironmentDate(currentEnvironment, releaseDates)
            : false;

        return initialShow && !loading && !!feature?.Value && !manualClose && !hideBecauseIsNewUser;
    }, [initialShow, loading, manualClose]);

    const onDisplayed = useCallback(() => {
        void update(false);
    }, []);

    const onClose = () => setManualClose(true);

    return { show, onDisplayed, onClose };
};

export default useSpotlightOnFeature;
