import { MIME_TYPES } from '@proton/shared/lib/constants';

import { WEIGHTS } from './config';
import { dateBlacklist } from './dateBlacklist';
import type { Extractor } from './extraction/extractors';
import { EXTRACTORS } from './extraction/models';
import type { NormalizedEmail, OneTimeCodeInput } from './normalize';
import { normalize } from './normalize';
import { prepareBody } from './preprocessing';
import { predictStrict, scoreCodes } from './scoring';

export type { OneTimeCodeInput } from './normalize';

export interface OneTimeCodeResult {
    code: string | null;
}

// Only extractors carrying a positive weight in the active config are run; a
// weight of 0 (or a missing entry) means the extractor is ignored entirely.
const ACTIVE_EXTRACTORS: Extractor[] = EXTRACTORS.filter((extractor) => WEIGHTS[extractor.name] > 0);

/**
 * Detects one-time codes (OTPs) inside an email's subject and body.
 *
 * ### Example Usage:
 * ```typescript
 * import OneTimeCodeDetector from 'proton-mail/helpers/message/otp/OneTimeCodeDetector';
 * const { code } = OneTimeCodeDetector.extract({ subject, body, mimeType, timestamp });
 * ```
 *
 * ### Description:
 * A set of lightweight extractors (see `otp/extraction`) each emit candidate
 * codes from a different surface — subject ends/middle/split, HTML tag contents,
 * visible text, leaf isolation, attribute metadata, "code:" / "code <X>"
 * phrasing, hyphenated-alpha AAA-BBB, and more. Each extractor has a weight (see
 * `otp/config`); candidates are tallied across all extractors and the
 * strictly-winning candidate (single highest score) is returned, or null if
 * there is no unique winner.
 *
 * A date-derived blacklist drops candidates that match permutations of the
 * email's own send date (YYYYMMDD, DDMMYY, MMDDYYYY, etc.) — those frequently
 * appear in mail headers and would otherwise win on weight.
 *
 * Detection runs entirely on-device.
 */
function run(extractors: Extractor[], { subject, body, kind, timestamp }: NormalizedEmail): OneTimeCodeResult {
    const blacklist = dateBlacklist(timestamp);

    // Parse and derive the body's shared text artifacts once, then hand them to
    // every extractor — rather than each extractor re-parsing the same HTML.
    const prepared = prepareBody(kind, body);
    const input = { subject, body, kind, ...prepared };

    const perExtractor: Record<string, string[]> = {};
    for (const extractor of extractors) {
        perExtractor[extractor.name] = extractor.extract(input).filter((code) => !blacklist.has(code));
    }

    const scores = scoreCodes(perExtractor, WEIGHTS);
    return { code: predictStrict(scores) };
}

function extract(input: OneTimeCodeInput): OneTimeCodeResult {
    return run(ACTIVE_EXTRACTORS, normalize(input));
}

/**
 * Extract a one-time code from the subject alone, running only the title
 * extractors (those flagged `isTitle`). Intended for surfaces where the body is
 * unavailable — e.g. the message list — so an empty body and the default MIME
 * type are passed through. The send-date blacklist is still applied via
 * `timestamp`.
 */
function extractFromTitle(input: { subject: string; timestamp: number }): OneTimeCodeResult {
    const normalized = normalize({
        subject: input.subject,
        body: '',
        mimeType: MIME_TYPES.DEFAULT,
        timestamp: input.timestamp,
    });
    const titleExtractors = ACTIVE_EXTRACTORS.filter((extractor) => extractor.isTitle);
    return run(titleExtractors, normalized);
}

export default { extract, extractFromTitle };
