import { c } from 'ttag';

// Matches the date suffix produced by getPlatformFriendlyDateForFileName, e.g. "2026-04-23 18.43.06".
const DATE_PATTERN_SOURCE = '\\d{4}-\\d{2}-\\d{2} \\d{2}\\.\\d{2}\\.\\d{2}';

// Unique placeholder used to locate the date within the translated template when building the detection regex.
const MARKER = '__DATE__';

function escapeRegExp(value: string): string {
    return value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/**
 * Single source of truth for the default document/spreadsheet title template.
 * Both the creation code and the detector below use this to prevent drift.
 */
function formatDefaultDocumentName(documentType: 'doc' | 'sheet', date: string): string {
    // translator: Default title for a new Proton Document (example: Untitled document 2024-04-23)
    return documentType === 'sheet'
        ? c('Title').t`Untitled spreadsheet ${date}`
        : c('Title').t`Untitled document ${date}`;
}

/**
 * Builds the default title used when creating a new document or spreadsheet.
 */
export function getDefaultDocumentName(documentType: 'doc' | 'sheet', date: string): string {
    return formatDefaultDocumentName(documentType, date);
}

/**
 * Returns true when the given title matches the default name pattern used for newly-created
 * documents and spreadsheets (a localized "Untitled" prefix followed by a timestamp).
 */
export function isDefaultDocumentName(title: string, documentType: 'doc' | 'sheet'): boolean {
    const template = formatDefaultDocumentName(documentType, MARKER);
    const markerIndex = template.indexOf(MARKER);
    const prefix = escapeRegExp(template.slice(0, markerIndex));
    const suffix = escapeRegExp(template.slice(markerIndex + MARKER.length));
    return new RegExp(`^${prefix}${DATE_PATTERN_SOURCE}${suffix}$`).test(title);
}
