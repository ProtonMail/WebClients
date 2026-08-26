/**
 * Updates an item in an array.
 */
export default function updateItem<T>(array: T[], index: number, newItem: T) {
    return array.map((item, i) => {
        if (i !== index) {
            return item;
        }
        return newItem;
    });
}
