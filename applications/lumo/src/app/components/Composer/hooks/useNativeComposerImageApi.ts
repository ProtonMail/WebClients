import { useCallback, useEffect, useState } from 'react';

import { onNativeToggleCreateImage, setNativeCreateImage } from '../../../remote/nativeComposerBridgeHelpers';

export const useNativeComposerImageApi = (): void => {
    const [createImageEnabled, setCreateImageEnabled] = useState(false);

    useEffect(() => {
        setNativeCreateImage(createImageEnabled);
    }, [createImageEnabled]);

    const handleCreateImageButtonClick = useCallback(() => {
        const newValue = !createImageEnabled;
        setCreateImageEnabled(newValue);
    }, [createImageEnabled]);

    useEffect(() => {
        const unsubscribeToggleCreateImage = onNativeToggleCreateImage((_) => {
            console.log('Received toggle create image listener');

            handleCreateImageButtonClick();
        });

        return () => {
            unsubscribeToggleCreateImage();
        };
    }, [handleCreateImageButtonClick]);
};
