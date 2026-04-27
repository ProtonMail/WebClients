import { useEffect } from 'react';

import type { ModelTier } from '../../../providers/ModelTierProvider';
import { onNativeChangeModelTier, setNativeModelTier } from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerModelTierApi = (modelTier: ModelTier, setModelTier: (modelTier: ModelTier) => void) => {
    useEffect(() => {
        setNativeModelTier(modelTier);
    }, [modelTier]);

    useEffect(() => {
        const unsubscribeChangeModel = onNativeChangeModelTier((e) => {
            console.log('Received model tier listener');

            const { modelTier } = e.detail;
            setModelTier(modelTier);
        });
        return () => {
            unsubscribeChangeModel();
        };
    }, []);
};
