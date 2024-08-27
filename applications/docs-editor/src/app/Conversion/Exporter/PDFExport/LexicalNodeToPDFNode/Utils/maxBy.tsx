/**
 * Computes the maximum value from an array based on a provided iteratee function.
 *
 * @template T - The type of elements in the input array.
 * @param {T[]} array - The array to iterate over.
 * @param {(item: T) => number} iteratee - The function invoked for each element in the array to generate the criterion by which the maximum is determined.
 * @returns {T | undefined} - Returns the element with the maximum computed value, or `undefined` if the array is empty.
 *
 * @example
 * interface Item {
 *   n: number;
 * }
 *
 * const items: Item[] = [{ n: 1 }, { n: 2 }, { n: 3 }];
 * const maxItem = maxBy(items, item => item.n);
 * console.log(maxItem); // Output: { n: 3 }
 */
export function maxBy<T>(array: T[], iteratee: (item: T) => number): T | undefined {
  if (!array || array.length === 0) {
    return undefined
  }

  let maxValue: T = array[0]
  let maxComputedValue = iteratee(maxValue)

  for (const item of array) {
    const computedValue = iteratee(item)
    if (computedValue > maxComputedValue) {
      maxValue = item
      maxComputedValue = computedValue
    }
  }

  return maxValue
}
