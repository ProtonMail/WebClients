import { useCallback, useMemo, useState } from 'react';

import { FeatureCode } from '../containers/features/FeaturesContext';
import useFeature from './useFeature';

const useSpotlightOnFeature = (code: FeatureCode, initialShow = true) => {
    const [manualClose, setManualClose] = useState(false);
    const { feature, update, loading } = useFeature(code);

    // If the feature flag value is changing right after the spotlight is displayed, we don't want it to be closed automatically
    const show = useMemo(() => {
        return initialShow && !loading && !!feature?.Value && !manualClose;
    }, [initialShow, loading, manualClose]);

    const onDisplayed = useCallback(() => {
        void update(false);
    }, []);

    const onClose = () => setManualClose(true);

    return { show, onDisplayed, onClose };
};

export default useSpotlightOnFeature;
