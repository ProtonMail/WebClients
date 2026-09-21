import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const ARTIFACT_SPOTLIGHT_SEEN_KEY = 'lumo-artifact-spotlight-seen';

interface ArtifactSpotlightSeenState {
    seenAt: number;
}

export const hasSeenArtifactCreateSpotlightLocally = (): boolean => {
    const state = readScopedLocalStorageJson<ArtifactSpotlightSeenState | null>(ARTIFACT_SPOTLIGHT_SEEN_KEY, null);
    return state?.seenAt !== undefined;
};

export const markArtifactCreateSpotlightSeenLocally = (): void => {
    writeScopedLocalStorageJson(ARTIFACT_SPOTLIGHT_SEEN_KEY, { seenAt: Date.now() });
};
