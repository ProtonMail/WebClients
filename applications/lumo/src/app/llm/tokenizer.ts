// Local ~4-chars/token approximation. Intentionally NOT an accurate tokenizer: gpt-tokenizer's
// o200k table is ~1.1MB over the wire (~2.2MB unpacked) and dominated mobile first-paint load
// (~46s on 3G). The server enforces the real context limit, so a rough estimate is enough here.
const CHARS_PER_TOKEN = 4;

/**
 * Approximate token count (≈4 characters per token).
 */
export const getApproximateTokenCount = (text: string): number => {
    if (!text || text.length === 0) return 0;
    return Math.ceil(text.length / CHARS_PER_TOKEN);
};

/**
 * Token count for message/context sizing. Uses the local approximation (see file note above).
 */
export const countTokens = (text: string | undefined): number => {
    if (!text || text.length === 0) return 0;
    return getApproximateTokenCount(text);
};
