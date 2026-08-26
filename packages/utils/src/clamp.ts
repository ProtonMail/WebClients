/**
 * Makes sure a value can't leave the bounds of defined
 * min & max values. If n is larger than max or smaller
 * than min, returns min or max respectively.
 */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(min, value), max);

export default clamp;
