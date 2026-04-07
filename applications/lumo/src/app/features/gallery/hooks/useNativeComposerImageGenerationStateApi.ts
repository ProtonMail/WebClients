import { useEffect } from 'react';

import {
    setNativeCreateImage,
    setNativeIsModelSectionEnabled,
    setNativeToolsEnabled,
    setNativeTsAndCsVisibility,
} from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerImageGenerationStateApi = (): void => {
    useEffect(() => {
        console.log('Mounting Gallery');
        setNativeCreateImage(true);
        setNativeIsModelSectionEnabled(false);
        setNativeToolsEnabled(false);
        setNativeTsAndCsVisibility(false);
        return () => {
            console.log('Unmounting Gallery');
            setNativeCreateImage(false);
            setNativeIsModelSectionEnabled(true);
            setNativeToolsEnabled(true);
            setNativeTsAndCsVisibility(true);
        };
    }, []);
};
