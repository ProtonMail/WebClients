import { c, msgid } from 'ttag';

import type { IndexingProgress } from '../../modules/search';

/**
 * Format indexing progress into a localized, user-facing sentence with the
 * appropriate trailing punctuation.
 *
 * Each non-zero category (files, folders, albums, photos) is first converted
 * into a pluralized segment via `ngettext` so the noun agrees with its count
 * in the target locale. The segments are then injected into one of four
 * arity-specific `c().t` templates ("Indexed ${a}", "Indexed ${a} and ${b}",
 * etc.) — each template is a single translation unit, which lets translators
 * control separators, conjunctions, and word order for their language
 * instead of receiving an already-concatenated string.
 *
 * Trailing punctuation is controlled by `isComplete`:
 *  - `false` → ellipsis ("…") to signal ongoing work.
 *  - `true`  → period to signal a settled total.
 *
 * Returns `null` when indexing is complete and nothing has been counted
 * (e.g. empty drive), so callers can skip rendering entirely.
 */
export function formatIndexingProgress(
    { files, folders, albums, photos }: IndexingProgress,
    isComplete: boolean
): string | null {
    const segments: string[] = [];
    if (files > 0) {
        segments.push(c('Info').ngettext(msgid`${files} file`, `${files} files`, files));
    }
    if (folders > 0) {
        segments.push(c('Info').ngettext(msgid`${folders} folder`, `${folders} folders`, folders));
    }
    if (albums > 0) {
        segments.push(c('Info').ngettext(msgid`${albums} album`, `${albums} albums`, albums));
    }
    if (photos > 0) {
        segments.push(c('Info').ngettext(msgid`${photos} photo`, `${photos} photos`, photos));
    }

    if (segments.length === 0) {
        // Done with nothing to show — caller should render nothing.
        if (isComplete) {
            return null;
        }
        return `${c('Info').t`Indexing in progress`}\u2026`;
    }

    const [first, second, third, fourth] = segments;
    let base: string;
    switch (segments.length) {
        case 1:
            base = c('Info').t`Indexed ${first}`;
            break;
        case 2:
            base = c('Info').t`Indexed ${first} and ${second}`;
            break;
        case 3:
            base = c('Info').t`Indexed ${first}, ${second} and ${third}`;
            break;
        default:
            base = c('Info').t`Indexed ${first}, ${second}, ${third} and ${fourth}`;
            break;
    }

    return isComplete ? `${base}.` : `${base}\u2026`;
}

export function hasIndexedAnything(progress: IndexingProgress): boolean {
    return progress.files + progress.folders + progress.albums + progress.photos > 0;
}
