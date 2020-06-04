/**
 * Convert { [key: string]: boolean } to bitmap
 * @param o ex: { announcements: true, features: false, newsletter: false, beta: false }
 * @returns bitmap
 */
export const toBitMap = (o: { [key: string]: boolean } = {}): number =>
    Object.keys(o).reduce((acc, key, index) => acc + (Number(o[key]) << index), 0);

/**
 * Define an Object from a bitmap value
 * @param value bitmap
 * @param keys ex: ['announcements', 'features', 'newsletter', 'beta']
 * @returns ex: { announcements: true, features: false, newsletter: false, beta: false }
 */
export const fromBitmap = (value: number, keys: string[] = []) =>
    keys.reduce<{ [key: string]: boolean }>((acc, key, index) => {
        acc[key] = !!(value & (1 << index));
        return acc;
    }, {});

/**
 * This method creates an object composed of the own and inherited enumerable property paths of object that are not omitted.
 * @param model The source object.
 * @param properties Properties to omit.
 * @retuns Returns a new object.
 */
export const omit = <T extends object, K extends keyof T>(model: T, properties: ReadonlyArray<K> = []): Omit<T, K> => {
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
export const pick = <T extends object, K extends keyof T>(model: T, properties: ReadonlyArray<K> = []) => {
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
 * Compare two objects but not deeply
 */
export const isEquivalent = (a: { [key: string]: any }, b: { [key: string]: any }) => {
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    if (aProps.length !== bProps.length) {
        return false;
    }

    for (let i = 0; i < aProps.length; i++) {
        const propName = aProps[i];

        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    return true;
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
