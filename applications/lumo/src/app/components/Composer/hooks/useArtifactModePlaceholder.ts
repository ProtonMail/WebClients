import { useCallback, useEffect, useState } from 'react';

import useInterval from '@proton/hooks/useInterval';

import { getArtifactPromptPlaceholders } from '../../../constants/artifactPromptPlaceholders';

const CYCLE_INTERVAL_MS = 5000;

export const useArtifactModePlaceholder = (isArtifactMode: boolean): string | undefined => {
    const placeholders = getArtifactPromptPlaceholders();
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!isArtifactMode) {
            setIndex(0);
        }
    }, [isArtifactMode]);

    const advancePlaceholder = useCallback(() => {
        setIndex((current) => (current + 1) % placeholders.length);
    }, [placeholders.length]);

    useInterval(advancePlaceholder, isArtifactMode ? CYCLE_INTERVAL_MS : null);

    if (!isArtifactMode) {
        return undefined;
    }

    return placeholders[index];
};
