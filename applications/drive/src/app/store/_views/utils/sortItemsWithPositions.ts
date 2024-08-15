/**
 * sortItemsWithPositions is meant to order a list based on passed positions.
 * Corresponding items wil be placed at the given position (positionsWithShareId) in the items array.
 **/
export function sortItemsWithPositions<T extends { rootShareId: string }>(
    items: T[],
    positionsWithShareId: Map<string, number>
) {
    positionsWithShareId.forEach((position, shareId) => {
        const itemIndex = items.findIndex((item) => item.rootShareId === shareId);
        const item = items.splice(itemIndex, 1)[0]; // Remove the item from the array
        items.splice(position, 0, item); // Insert the item at the new index
    });
    return items;
}
