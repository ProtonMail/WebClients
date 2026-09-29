import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const ARTIFACT_PANEL_SPOTLIGHT_SEEN_KEY = 'lumo-artifact-panel-spotlight-seen';

interface ArtifactPanelSpotlightSeenState {
    seenAt: number;
}

export const hasSeenArtifactPanelSpotlightLocally = (): boolean => {
    const state = readScopedLocalStorageJson<ArtifactPanelSpotlightSeenState | null>(
        ARTIFACT_PANEL_SPOTLIGHT_SEEN_KEY,
        null
    );
    return state?.seenAt !== undefined;
};

export const markArtifactPanelSpotlightSeenLocally = (): void => {
    writeScopedLocalStorageJson(ARTIFACT_PANEL_SPOTLIGHT_SEEN_KEY, { seenAt: Date.now() });
};
