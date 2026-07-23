import { type Dispatch, type SetStateAction, useCallback, useRef, useState } from 'react';

import type { ImageAspectRatio } from '../../../types';

const DEFAULT_ASPECT_RATIO: ImageAspectRatio = '1:1';

interface UseImageGenerationModeResult {
    selectedAspectRatio: ImageAspectRatio;
    handleAspectRatioChange: (ratio: ImageAspectRatio) => void;
    isCreateImageMode: boolean;
    // Exposed as the raw state dispatcher so callers can flip it with a functional
    // updater (e.g. the native toggle bridge) without capturing a stale value.
    setIsCreateImageMode: Dispatch<SetStateAction<boolean>>;
    // Stable getter for use inside callbacks that must not capture a stale value
    getAspectRatio: () => ImageAspectRatio;
}

export const useImageGenerationMode = (): UseImageGenerationModeResult => {
    const [selectedAspectRatio, setSelectedAspectRatio] = useState<ImageAspectRatio>(DEFAULT_ASPECT_RATIO);
    const aspectRatioRef = useRef<ImageAspectRatio>(DEFAULT_ASPECT_RATIO);
    const [isCreateImageMode, setIsCreateImageMode] = useState(false);

    const handleAspectRatioChange = useCallback((ratio: ImageAspectRatio) => {
        setSelectedAspectRatio(ratio);
        aspectRatioRef.current = ratio;
    }, []);

    const getAspectRatio = useCallback(() => aspectRatioRef.current ?? DEFAULT_ASPECT_RATIO, []);

    return {
        selectedAspectRatio,
        handleAspectRatioChange,
        isCreateImageMode,
        setIsCreateImageMode,
        getAspectRatio,
    };
};
