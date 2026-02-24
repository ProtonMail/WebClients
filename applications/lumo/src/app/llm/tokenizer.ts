import { encode as gptOssTokenize } from 'gpt-tokenizer/encoding/o200k_harmony';

// Simple approximation for token counting (4 characters per token)
const CHARS_PER_TOKEN = 4;

/**
 * Simple token count approximation (4 characters per token)
 * This is fast and sufficient for most use cases
 */
export const getApproximateTokenCount = (text: string): number => {
    if (!text || text.length === 0) return 0;
    return Math.ceil(text.length / CHARS_PER_TOKEN);
};

/**
 * Get accurate token count using o200k_harmony encoding (for gpt-oss-120b)
 * Falls back to approximation if encoding fails
 * @param text - Text to tokenize
 */
export const countTokens = (text: string | undefined): number => {
    if (!text || text.length === 0) return 0;

    try {
        const tokens = gptOssTokenize(text);
        return tokens.length;
    } catch (error) {
        console.warn('[Tokenizer] Failed to count tokens, falling back to approximation:', error);
        // Fallback to approximation if encoding fails
        return getApproximateTokenCount(text);
    }
};
