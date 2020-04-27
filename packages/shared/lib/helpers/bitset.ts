/**
 * Set bit on the number
 */
export const setBit = (number = 0, mask: number): number => number | mask;

/**
 * Toggle a bit from the number
 */
export const toggleBit = (number = 0, mask: number): number => number ^ mask;

/**
 * Clear a bit from the number
 */
export const clearBit = (number = 0, mask: number): number => number & ~mask;

/**
 * Check if a bit is set in the number
 */
export const hasBit = (number = 0, mask: number): boolean => (number & mask) === mask;
