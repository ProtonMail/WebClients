/**
 * Tells whether or not a given value is between two other given min and max values,
 * including the min value, but excluding the max value.
 */
const isBetween = (value: number, min: number, max: number) => value >= min && value < max;

export default isBetween;
