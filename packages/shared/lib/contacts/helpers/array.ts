import { move } from '../../helpers/array';

/**
 * Re-order elements in an array inside a group of arrays
 */
export const moveInGroup = <T>(
    collection: T[][],
    groupIndex: number,
    { oldIndex, newIndex }: { oldIndex: number; newIndex: number }
) => {
    return collection.map((group, i) => {
        if (i === groupIndex) {
            return move(group, oldIndex, newIndex);
        }
        return group;
    });
};
