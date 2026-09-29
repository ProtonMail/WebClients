/**
 * Convert { [key: string]: boolean } to bitmap
 * @param o ex: { announcements: true, features: false, newsletter: false, beta: false }
 * @returns bitmap
 */
export const toBitMap = (o: { [key: string]: boolean } = {}): number =>
    Object.keys(o).reduce((acc, key, index) => acc + (Number(o[key]) << index), 0);

/**
 * This method creates an object composed of the own and inherited enumerable property paths of object that are not omitted.
 * @param model The source object.
 * @param properties Properties to omit.
 * @retuns Returns a new object.
 */
export const omit = <T extends object, K extends keyof T>(model: T, properties: readonly K[] = []): Omit<T, K> => {
    const result = { ...model };
    for (let i = 0; i < properties.length; ++i) {
        delete result[properties[i]];
    }
    return result;
};

/**
 * Review of omit function
 * @param model The source object.
 * @param properties Properties to keep.
 * @return Returns a new object.
 */
export const pick = <T extends object, K extends keyof T>(model: T, properties: readonly K[] = []) => {
    const result: Pick<T, K> = {} as any;
    for (let i = 0; i < properties.length; ++i) {
        const key = properties[i];
        if (key in model) {
            result[key] = model[key];
        }
    }
    return result;
};

/**
 * Create a map from a collection
 */
export const toMap = <T extends { [key: string]: any }, K extends keyof T>(
    collection: T[] = [],
    key: K = 'ID' as K
) => {
    const result: { [key in T[K]]: T } = {} as any;
    for (let i = 0; i < collection.length; i++) {
        const item = collection[i];
        result[item[key]] = item;
    }
    return result;
};
