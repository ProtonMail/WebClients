export function sortItemsWithPositions<T extends { rootShareId: string }>(
    items: T[],
    positionsWithShareId: Map<string, number>
): T[] {
    if (!positionsWithShareId.size) {
        return items;
    }
    const sortedItems: (T | undefined)[] = new Array(items.length).fill(undefined);

    // Place items with specified positions
    positionsWithShareId.forEach((position, shareId) => {
        const item = items.find((item) => item.rootShareId === shareId);
        if (item) {
            sortedItems[position] = item;
        }
    });

    // Fill in the remaining items in their original order
    let filledPosition = 0;
    items.forEach((item) => {
        if (!positionsWithShareId.has(item.rootShareId)) {
            // Find the next available position
            while (sortedItems[filledPosition] !== undefined) {
                filledPosition++;
            }
            sortedItems[filledPosition] = item;
            filledPosition++;
        }
    });

    // Remove any undefined entries (in case positions were out of bounds)
    return sortedItems.filter((item): item is T => item !== undefined);
}
