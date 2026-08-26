/**
 * Adds an item to an array
 */
export default function addItem<T>(array: T[], item: T) {
    return array.concat(item);
}
