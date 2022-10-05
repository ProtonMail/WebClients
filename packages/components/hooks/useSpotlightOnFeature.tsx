import { useCallback, useMemo, useState } from 'react';

import useEarlyAccess from '@proton/components/hooks/useEarlyAccess';
import useUser from '@proton/components/hooks/useUser';
import { SECOND } from '@proton/shared/lib/constants';
import { Environment } from '@proton/shared/lib/environment/helper';

import { FeatureCode } from '../containers/features/FeaturesContext';
import useFeature from './useFeature';

/**
 * @dev Pass releaseDates if you want to hide the spotlight for users created after the release date
 */
const useSpotlightOnFeature = (
    code: FeatureCode,
    initialShow = true,
    releaseDates?: Record<Environment | 'default', number>
) => {
    const [manualClose, setManualClose] = useState(false);
    const { feature, update, loading: loadingFeature } = useFeature(code);
    const [user, loadingUser] = useUser();
    const { currentEnvironment, loading: loadingCurrentEnvironment } = useEarlyAccess();

    const loading = loadingFeature || loadingUser || !user || loadingCurrentEnvironment;

    // If the feature flag value is changing right after the spotlight is displayed, we don't want it to be closed automatically
    const show = useMemo(() => {
        const hideBecauseIsNewUser = releaseDates
            ? user.CreateTime * SECOND > releaseDates[currentEnvironment || 'default']
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
