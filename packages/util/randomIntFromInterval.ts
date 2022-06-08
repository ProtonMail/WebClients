/**
 * Returns a random integer within an interval inclusive of the min and max.
 *
 * Does not use a cryptographically-secure pseudorandom number generator
 */
export default function randomIntFromInterval(
    /**
     * The smallest value in the interval
     */
    min: number,
    /**
     * The largest value in the interval
     */
    max: number
) {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1) + min);
}
