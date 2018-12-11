/**
 * Set bit on the number
 * @param {Integer} number
 * @param {Integer} mask
 * @return {Integer}
 */
export const setBit = (number = 0, mask) => number | mask;

/**
 * Toggle a bit from the number
 * @param {Integer} number
 * @param {Integer} mask
 * @return {Integer}
 */
export const toggleBit = (number = 0, mask) => number ^ mask;

/**
 * Clear a bit from the number
 * @param {Integer} number
 * @param {Integer} mask
 * @return {Integer}
 */
export const clearBit = (number = 0, mask) => number & ~mask;

/**
 * Check if a bit is set in the number
 * @return {function({Flags}): boolean}
 */
export const hasBit = (number = 0, mask) => (number & mask) === mask;
