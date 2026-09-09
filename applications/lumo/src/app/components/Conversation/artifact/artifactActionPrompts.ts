import { c } from 'ttag';

import type { ArtifactActionMeta } from '../../../types';

export function buildArtifactActionLlmPrompt(meta: ArtifactActionMeta): string {
    const { kind, artifactId, artifactTitle, selection, userInstruction } = meta;

    if (kind === 'explain') {
        return c('collider_2025:Prefill')
            .t`Explain this selected part of the "${artifactTitle}" code artifact (id: ${artifactId}):\n\n"${selection}"`;
    }

    if (kind === 'improve') {
        return c('collider_2025:Prefill')
            .t`Improve this selected part of the "${artifactTitle}" code artifact (id: ${artifactId}). Update the artifact, replacing:\n\n"${selection}"\n\nwith improved code.`;
    }

    const instruction = userInstruction ?? '';

    return c('collider_2025:Prefill')
        .t`Edit the "${artifactTitle}" artifact (id: ${artifactId}). Replace this part:\n\n"${selection}"\n\nwith: ${instruction}`;
}

export function getArtifactActionLabel(kind: ArtifactActionMeta['kind']): string {
    if (kind === 'explain') {
        return c('collider_2025:Action').t`Explain`;
    }
    if (kind === 'improve') {
        return c('collider_2025:Action').t`Improve`;
    }
    return c('collider_2025:Action').t`Edit`;
}

export function getArtifactActionDisplayContent(meta: ArtifactActionMeta): string {
    const label = getArtifactActionLabel(meta.kind);
    return `${label} · ${meta.artifactTitle}`;
}
