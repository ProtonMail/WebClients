import { useEffect } from 'react';

import type { ModelTier, ResponseMode } from '../../../providers/ModelTierProvider';
import {
    onNativeChangeModelTier,
    onNativeChangeResponseMode,
    setNativeModelTier,
    setNativeResponseMode,
} from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerModelTierApi = (
    modelTier: ModelTier,
    setModelTier: (modelTier: ModelTier) => boolean,
    responseMode: ResponseMode,
    setResponseMode: (responseMode: ResponseMode) => void
) => {
    useEffect(() => {
        setNativeModelTier(modelTier);
    }, [modelTier]);

    useEffect(() => {
        setNativeResponseMode(responseMode);
    }, [responseMode]);

    useEffect(() => {
        const unsubscribeChangeModel = onNativeChangeModelTier((e) => {
            console.log('Received model tier listener');

            const { modelTier: requestedModelTier } = e.detail;
            const didChangeModel = setModelTier(requestedModelTier);
            if (!didChangeModel) {
                setNativeModelTier(modelTier);
            }
        });
        const unsubscribeChangeResponseMode = onNativeChangeResponseMode((e) => {
            console.log('Received response mode listener');

            const { responseMode } = e.detail;
            setResponseMode(responseMode);
        });
        return () => {
            unsubscribeChangeModel();
            unsubscribeChangeResponseMode();
        };
    }, [modelTier, setModelTier, setResponseMode]);
};
