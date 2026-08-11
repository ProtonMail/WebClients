import type { MessageId } from '../../../types';
import type { ArtifactRegistry } from './artifactRegistry';
import { getArtifactVersionIndexForMessage } from './artifactRegistry';

export type ArtifactChipVisualState = 'default' | 'active' | 'superseded';

export interface ArtifactChipStateInput {
    artifactId: string;
    messageId: MessageId;
    selectedId: string | null;
    selectedVersionIndex: number;
    registry: ArtifactRegistry;
}

export function getArtifactWordCount(content: string): number {
    const trimmed = content.trim();
    if (!trimmed) {
        return 0;
    }
    return trimmed.split(/\s+/).length;
}

export function getArtifactLineCount(content: string): number {
    if (!content) {
        return 0;
    }
    return content.split('\n').length;
}

export function isArtifactChipAwaitingRegistry(
    registry: ArtifactRegistry,
    artifactId: string,
    messageId: MessageId
): boolean {
    return getArtifactVersionIndexForMessage(registry, artifactId, messageId) === null;
}

export function getArtifactChipVersionNumber(
    registry: ArtifactRegistry,
    artifactId: string,
    messageId: MessageId
): number {
    const versionIndex = getArtifactVersionIndexForMessage(registry, artifactId, messageId);
    if (versionIndex !== null) {
        return versionIndex + 1;
    }
    return (registry[artifactId]?.versions.length ?? 0) + 1;
}

export function getArtifactChipVisualState(input: ArtifactChipStateInput): ArtifactChipVisualState {
    const { artifactId, messageId, selectedId, selectedVersionIndex, registry } = input;
    const versionIndex = getArtifactVersionIndexForMessage(registry, artifactId, messageId);

    if (selectedId !== artifactId) {
        return 'default';
    }

    if (versionIndex !== null && versionIndex === selectedVersionIndex) {
        return 'active';
    }

    if (versionIndex !== null && versionIndex !== selectedVersionIndex) {
        return 'superseded';
    }

    return 'default';
}
