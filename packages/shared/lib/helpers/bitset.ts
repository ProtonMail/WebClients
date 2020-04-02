/**
 * Set bit on the number
 */
export const setBit = (number: number = 0, mask: number): number => number | mask;

/**
 * Toggle a bit from the number
 */
export const toggleBit = (number: number = 0, mask: number): number => number ^ mask;

/**
 * Clear a bit from the number
 */
export const clearBit = (number: number = 0, mask: number): number => number & ~mask;

/**
 * Check if a bit is set in the number
 */
export const hasBit = (number: number = 0, mask: number): boolean => (number & mask) === mask;
