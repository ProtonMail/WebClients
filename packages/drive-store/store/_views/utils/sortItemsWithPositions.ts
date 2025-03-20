/**
 * Sorts items based on provided positions map, placing items with defined positions first
 * and filling gaps with remaining items in their original order.
 * @param items Array of items to sort, each containing a rootShareId
 * @param positionsWithShareId Map of rootShareId to desired position
 * @returns Sorted array of items
 */
export function sortItemsWithPositions<T extends { rootShareId: string }>(
    items: T[],
    positionsWithShareId: Map<string, number>
): T[] {
    if (!positionsWithShareId.size || !items.length) {
        return items;
    }

    const sortedItems = new Array(positionsWithShareId.size).fill(undefined);

    items.forEach((item) => {
        const position = positionsWithShareId.get(item.rootShareId);
        if (position !== undefined) {
            sortedItems[position] = item;
        }
    });

    let nextEmptyPosition = 0;
    items.forEach((item) => {
        if (!positionsWithShareId.has(item.rootShareId)) {
            while (sortedItems[nextEmptyPosition] !== undefined) {
                nextEmptyPosition++;
            }
            sortedItems[nextEmptyPosition] = item;
        }
    });

    return sortedItems.filter((item) => item !== undefined);
}
