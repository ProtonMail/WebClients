import { useEffect } from 'react';

import { useFlag } from '@proton/unleash/useFlag';

import { preloadBackgroundProcessorAssets } from '../../processors/background-processor/createBackgroundProcessor';
import type { BackgroundProcessorVersion } from '../../processors/background-processor/types';

export const useBackgroundProcessorPreload = () => {
    const isNewBackgroundBlurVersionEnabled = useFlag('MeetUseNewBackgroundBlurVersion');

    const backgroundProcessorVersion: BackgroundProcessorVersion = isNewBackgroundBlurVersionEnabled
        ? 'next'
        : 'current';

    useEffect(() => {
        void preloadBackgroundProcessorAssets(backgroundProcessorVersion);
    }, [backgroundProcessorVersion]);

    return { backgroundProcessorVersion };
};
