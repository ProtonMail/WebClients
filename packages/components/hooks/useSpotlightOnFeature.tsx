import { useCallback, useState } from 'react';

import { FeatureCode } from '../containers/features/FeaturesContext';
import useFeature from './useFeature';

const useSpotlightOnFeature = (code: FeatureCode, initialShow = true) => {
    const [manualClose, setManualClose] = useState(false);
    const { feature, update, loading } = useFeature(code);

    const show = initialShow && !loading && !!feature?.Value && !manualClose;

    const onDisplayed = useCallback(() => {
        void update(false);
    }, []);

    const onClose = () => setManualClose(true);

    return { show, onDisplayed, onClose };
};

export default useSpotlightOnFeature;
