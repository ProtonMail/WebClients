import { type Dispatch, type SetStateAction, useState } from 'react';

interface UseArtifactModeResult {
    isArtifactMode: boolean;
    setIsArtifactMode: Dispatch<SetStateAction<boolean>>;
}

/**
 * Explicit, user-initiated "Create artifact" mode for the composer (phase 2).
 * Persisted availability is handled by `ArtifactCreationProvider`; this hook is
 * reserved for a future one-shot explicit mode with placeholders.
 */
export const useArtifactMode = (): UseArtifactModeResult => {
    const [isArtifactMode, setIsArtifactMode] = useState(false);

    return { isArtifactMode, setIsArtifactMode };
};
