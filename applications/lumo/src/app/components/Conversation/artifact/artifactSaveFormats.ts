import { c } from 'ttag';

import type { ArtifactType } from './parseArtifacts';

export type ArtifactSaveFormat = 'docx' | 'md' | 'txt' | 'pdf' | 'pptx';

const DOCUMENT_SAVE_FORMATS: ArtifactSaveFormat[] = ['docx', 'pdf', 'md', 'txt'];
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
        case 'docx':
            return c('collider_2025:Action').t`Word (.docx)`;
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

/** Format name in the title menu's Download / Save to Drive submenus; the extension sits beside it. */
export function getArtifactFormatMenuLabel(format: ArtifactSaveFormat): string {
    switch (format) {
        case 'docx':
            return c('collider_2025:Action').t`Word document`;
        case 'md':
            return c('collider_2025:Action').t`Markdown`;
        case 'txt':
            return c('collider_2025:Action').t`Plain text`;
        case 'pdf':
            return c('collider_2025:Action').t`PDF`;
        case 'pptx':
            return c('collider_2025:Action').t`PowerPoint`;
        default:
            return format;
    }
}

/** Name of the "source" download (the canonical bytes, see artifactSourceDownload) for each type. */
export function getArtifactSourceMenuLabel(type: ArtifactType): string {
    switch (type) {
        case 'document':
            return c('collider_2025:Action').t`Markdown`;
        case 'presentation':
            return c('collider_2025:Action').t`Web presentation`;
        case 'webpage':
            return c('collider_2025:Action').t`Webpage`;
        default:
            return c('collider_2025:Action').t`Source file`;
    }
}
