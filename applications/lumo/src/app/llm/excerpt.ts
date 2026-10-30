import { countTokens } from './tokenizer';

const CHARS_PER_TOKEN = 4;
/** Share of an excerpt taken from the start of the text; the rest comes from the end. */
const HEAD_SHARE = 0.6;

/**
 * Shorten `text` to roughly `maxTokens` by keeping its start and end and replacing the
 * middle with `marker`. Returns the text unchanged when it already fits.
 */
export function excerptToTokens(text: string, maxTokens: number, marker: string): string {
    if (countTokens(text) <= maxTokens) {
        return text;
    }
    const maxChars = Math.max(0, maxTokens * CHARS_PER_TOKEN - marker.length);
    const headChars = Math.floor(maxChars * HEAD_SHARE);
    const tailChars = maxChars - headChars;
    return `${text.slice(0, headChars)}${marker}${tailChars > 0 ? text.slice(text.length - tailChars) : ''}`;
}
