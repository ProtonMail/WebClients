export type UpdateCollectionV6<T> = { delete: string[]; upsert: T[] };

const defaultCreate = <T, Y>(value: Y) => value as unknown as T;
const defaultMerge = <T, Y>(a: T, b: Y) => b as unknown as T;

export const updateCollectionV6 = <T extends { ID: string }, Y extends { ID: string }>(
    list: T[],
    updates: UpdateCollectionV6<Y>,
    {
        create = defaultCreate,
        merge = defaultMerge,
    }: {
        create?: (a: Y) => T;
        merge?: (a: T, b: Y) => T;
    } = {}
) => {
    const copy = [...list];

    const idToIndex = copy.reduce<{ [key: string]: number }>((acc, element, index) => {
        acc[element.ID] = index;
        return acc;
    }, Object.create(null));

    for (const update of updates.upsert) {
        if (!update.ID) {
            continue;
        }
        const index = idToIndex[update.ID];
        if (index === undefined) {
            copy.push(create(update));
        } else {
            const prev = copy[index];
            copy[index] = merge(prev, update);
        }
    }

    const deleteSet = new Set(updates.delete);
    return copy.filter((item) => !deleteSet.has(item.ID));
};
