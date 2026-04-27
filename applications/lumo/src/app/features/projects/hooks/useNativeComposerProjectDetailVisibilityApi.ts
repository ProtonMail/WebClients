import { useEffect } from 'react';

import { setNativeComposerVisibility } from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerProjectDetailVisibilityApi = (renderSidebar: boolean): void => {
    useEffect(() => {
        if (!renderSidebar) {
            return;
        }
        setNativeComposerVisibility(false);
        return () => setNativeComposerVisibility(true);
    }, [renderSidebar]);
};
