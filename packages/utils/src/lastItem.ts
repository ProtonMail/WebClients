/**
 * Returns the last item in an array
 */
export default function lastItem<T>(array: ArrayLike<T>): T | undefined {
    return array[array.length - 1];
}
