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
 * Get token count using fast approximation
 * @param text - Text to tokenize
 * @param useAccurate - Legacy parameter for backwards compatibility (ignored)
 */
export const getTokenCount = (text: string, useAccurate: boolean = false): number => {
    return getApproximateTokenCount(text);
};
