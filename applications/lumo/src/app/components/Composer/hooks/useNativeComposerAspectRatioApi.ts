import { type Dispatch, type SetStateAction, useEffect } from 'react';

import {
    onNativeChangeAspectRatio,
    onNativeToggleCreateImage,
    setNativeAspectRatio,
    setNativeCreateImage,
} from '../../../remote/nativeComposerBridgeHelpers';
import type { ImageAspectRatio } from '../../../types';

export const useNativeComposerAspectRatioApi = (
    selectedAspectRatio: ImageAspectRatio,
    setAspectRatio: (ratio: ImageAspectRatio) => void,
    isCreateImageMode: boolean,
    setIsCreateImageMode: Dispatch<SetStateAction<boolean>>
) => {
    useEffect(() => {
        setNativeAspectRatio(selectedAspectRatio);
    }, [selectedAspectRatio]);

    useEffect(() => {
        return onNativeChangeAspectRatio((e) => {
            console.log('Received aspect ratio listener');

            const { aspectRatio } = e.detail;
            setAspectRatio(aspectRatio);
        });
    }, [setAspectRatio]);

    // Mirror the web's create-image mode into native so it shows the correct state.
    useEffect(() => {
        setNativeCreateImage(isCreateImageMode);
    }, [isCreateImageMode]);

    // Native fires a toggle (no value), so flip the current mode. The functional
    // updater keeps this listener stable — it never needs the latest value in scope.
    useEffect(() => {
        return onNativeToggleCreateImage(() => {
            console.log('Received toggle create image listener');

            setIsCreateImageMode((prev) => !prev);
        });
    }, [setIsCreateImageMode]);
};
