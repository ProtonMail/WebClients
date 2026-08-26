/**
 * Returns a new array with the item moved to the new position.
 * @param list List of items
 * @param from Index of item to move. If negative, it will begin that many elements from the end.
 * @param to Index of where to move the item. If negative, it will begin that many elements from the end.
 * @return New array with the item moved to the new position
 */
const move = <T>(list: T[] = [], from: number, to: number) => {
    const copy = list.slice();
    copy.splice(to < 0 ? copy.length + to : to, 0, copy.splice(from, 1)[0]);
    return copy;
};

export default move;
