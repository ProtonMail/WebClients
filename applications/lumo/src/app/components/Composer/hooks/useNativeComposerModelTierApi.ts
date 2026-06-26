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
    setModelTier: (modelTier: ModelTier) => void,
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

            const { modelTier } = e.detail;
            setModelTier(modelTier);
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
    }, [setModelTier, setResponseMode]);
};
