import { c } from 'ttag';

import type { ArtifactType } from './parseArtifacts';

export type ArtifactSaveFormat = 'md' | 'txt' | 'pdf' | 'pptx';

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
        return c('collider_2025:Action').t`Download web presentation (HTML)`;
    }

    return c('collider_2025:Action').t`Download source file`;
}

export function getArtifactDownloadLabel(format: ArtifactSaveFormat, type?: ArtifactType): string {
    switch (format) {
        case 'txt':
            return c('collider_2025:Action').t`Download plain text`;
        case 'pdf':
            // Documents open the print dialog to "Save as PDF" (see getArtifactPdfExportMode); the
            // ellipsis signals that a dialog follows.
            if (type === 'document') {
                return c('collider_2025:Action').t`Save as PDF…`;
            }
            return c('collider_2025:Action').t`Download PDF`;
        case 'pptx':
            return c('collider_2025:Action').t`Download PPTX`;
        default:
            return getArtifactSaveFormatLabel(format);
    }
}
