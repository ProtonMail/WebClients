import { useEffect } from 'react';

import { preloadBackgroundProcessorAssets } from '../../processors/background-processor/createBackgroundProcessor';
import { useIsBackgroundEffectsSupported } from './useIsBackgroundEffectsSupported';

export const useBackgroundProcessorPreload = () => {
    const isBackgroundEffectsSupported = useIsBackgroundEffectsSupported();

    useEffect(() => {
        if (!isBackgroundEffectsSupported) {
            return;
        }

        void preloadBackgroundProcessorAssets();
    }, [isBackgroundEffectsSupported]);
};
