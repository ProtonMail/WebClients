import type { ArtifactType } from './parseArtifacts';

/** Left accent pane modifier per artifact kind (Figma chip styling). */
export const getArtifactChipIconPaneClass = (type: ArtifactType): string => {
    return `artifact-chip-icon-pane--${type}`;
};
