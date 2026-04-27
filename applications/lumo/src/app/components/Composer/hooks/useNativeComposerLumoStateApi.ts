import { useEffect } from 'react';

import { LumoMode } from '../../../remote/nativeComposerBridge';
import { setNativeLumoState } from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerLumoStateApi = (isGenerating: boolean | undefined) => {
    useEffect(() => {
        setNativeLumoState(isGenerating ? LumoMode.Working : LumoMode.Idle);
    }, [isGenerating]);
};
