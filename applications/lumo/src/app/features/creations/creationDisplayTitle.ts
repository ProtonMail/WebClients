import { c } from 'ttag';

import type { GeneratedArtifactAssetMeta } from '../../types';

const PLACEHOLDER_FILENAME = /^creation-[0-9a-f-]+\.md$/i;

export function getCreationDisplayTitle(
    filename: string | undefined,
    meta: GeneratedArtifactAssetMeta | undefined,
    isLoading: boolean
): string {
    if (meta?.artifactTitle?.trim()) {
        return meta.artifactTitle.trim();
    }

    if (filename && !PLACEHOLDER_FILENAME.test(filename)) {
        return filename.replace(/\.md$/i, '').trim() || filename;
    }

    if (isLoading) {
        return '';
    }

    return c('collider_2025:Title').t`Untitled document`;
}
