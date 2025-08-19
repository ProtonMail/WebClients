export type UpdateCollectionV6<T> = { delete: string[]; upsert: T[] };

const defaultCreate = <T, Y>(value: Y) => value as unknown as T;
const defaultMerge = <T, Y>(a: T, b: Y) => b as unknown as T;

type Model<IdKey extends string> = {
    // The ID key is required and must be a string.
    [key in IdKey]: string;
};

export const updateCollectionV6 = <T extends Model<IdKey>, Y extends Model<IdKey>, IdKey extends string = 'ID'>(
    list: T[],
    updates: UpdateCollectionV6<Y>,
    {
        create = defaultCreate,
        merge = defaultMerge,
        idKey = 'ID' as IdKey,
    }: {
        create?: (a: Y) => T;
        merge?: (a: T, b: Y) => T;
        idKey?: IdKey;
    } = {}
) => {
    const copy = [...list];

    const idToIndex = copy.reduce<{ [key: string]: number }>((acc, element, index) => {
        acc[element[idKey]] = index;
        return acc;
    }, Object.create(null));

    for (const update of updates.upsert) {
        if (!update[idKey]) {
            continue;
        }
        const index = idToIndex[update[idKey]];
        if (index === undefined) {
            copy.push(create(update));
        } else {
            const prev = copy[index];
            copy[index] = merge(prev, update);
        }
    }

    const deleteSet = new Set(updates.delete);
    return copy.filter((item) => !deleteSet.has(item[idKey]));
};
