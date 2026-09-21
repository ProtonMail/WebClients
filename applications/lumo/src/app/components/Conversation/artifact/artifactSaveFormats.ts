import { c } from 'ttag';

import type { ArtifactType } from './parseArtifacts';

export const ARTIFACT_SAVE_FORMATS = ['md', 'txt', 'pdf', 'pptx'] as const;

export type ArtifactSaveFormat = (typeof ARTIFACT_SAVE_FORMATS)[number];

const DOCUMENT_SAVE_FORMATS: ArtifactSaveFormat[] = ['md', 'txt', 'pdf'];
const PRESENTATION_SAVE_FORMATS: ArtifactSaveFormat[] = ['pdf', 'pptx'];

export function getArtifactSaveFormats(type: ArtifactType): ArtifactSaveFormat[] {
    if (type === 'document') {
        return DOCUMENT_SAVE_FORMATS;
    }

    if (type === 'presentation') {
        return PRESENTATION_SAVE_FORMATS;
    }

    return [];
}

export function artifactSupportsSaveToDrive(type: ArtifactType): boolean {
    return getArtifactSaveFormats(type).length > 0;
}

export function isArtifactSaveFormatSupported(type: ArtifactType, format: ArtifactSaveFormat): boolean {
    return getArtifactSaveFormats(type).includes(format);
}

export function getArtifactSaveFormatLabel(format: ArtifactSaveFormat): string {
    switch (format) {
        case 'md':
            return c('collider_2025:Action').t`Source (Markdown)`;
        case 'txt':
            return c('collider_2025:Action').t`Plain text (.txt)`;
        case 'pdf':
            return c('collider_2025:Action').t`PDF`;
        case 'pptx':
            return c('collider_2025:Action').t`PowerPoint (.pptx)`;
        default:
            return format;
    }
}

export function getArtifactSourceDownloadLabel(type: ArtifactType): string {
    if (type === 'document') {
        return c('collider_2025:Action').t`Download source (Markdown)`;
    }

    if (type === 'presentation') {
        return c('collider_2025:Action').t`Download source (HTML)`;
    }

    return c('collider_2025:Action').t`Download source file`;
}

export function getArtifactDownloadLabel(format: ArtifactSaveFormat): string {
    switch (format) {
        case 'txt':
            return c('collider_2025:Action').t`Download plain text`;
        case 'pdf':
            return c('collider_2025:Action').t`Download PDF`;
        case 'pptx':
            return c('collider_2025:Action').t`Download PPTX`;
        default:
            return getArtifactSaveFormatLabel(format);
    }
}

export function getArtifactSaveFormatExtension(format: ArtifactSaveFormat): string {
    return format;
}
