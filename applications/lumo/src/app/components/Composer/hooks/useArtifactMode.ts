import { type Dispatch, type SetStateAction, useState } from 'react';

interface UseArtifactModeResult {
    isArtifactMode: boolean;
    setIsArtifactMode: Dispatch<SetStateAction<boolean>>;
}

/**
 * Explicit, user-initiated "Create artifact" mode for the composer, mirroring
 * `useImageGenerationMode`. Entering it is the sole trigger for a *new* artifact —
 * revisions of an already-existing artifact are handled separately, based on
 * conversation state rather than this toggle (see `artifactToolMode` in helper.ts).
 */
export const useArtifactMode = (): UseArtifactModeResult => {
    const [isArtifactMode, setIsArtifactMode] = useState(false);

    return { isArtifactMode, setIsArtifactMode };
};
