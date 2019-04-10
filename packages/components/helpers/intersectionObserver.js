/**
 * Given a list of numbers, find the index of the maximum
 * @param {Array<Number>} numbers   List of numbers
 * @return {number}                 Index of maximum (first instance found). Returns -1 if given an empty list
 */
export const indexOfMax = (numbers) => {
    const max = Math.max(...numbers);
    return numbers.findIndex((elm) => elm === max);
};

/**
 * Given a granularity, build the corresponding array of thresholds
 * @param {number} granularity      How many divisions we make to an area in order to observe it with an intersectionObserver.
 * @return {number}                 Array of thresholds where intersectionObserver will be triggered (essentially as overlap area changes by 1/granularity)
 */
export const buildThresholds = (granularity) => {
    const steps = parseInt(granularity, 10);
    const thresholds = [];

    for (let i = 0; i <= steps; i++) {
        thresholds.push(i / steps);
    }
    return thresholds;
};
