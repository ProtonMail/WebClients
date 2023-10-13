export const objectDelete = <K extends string | number | symbol, D extends K, V>(
    object: Record<K, V>,
    key: D
): Omit<Record<K, V>, D> => {
    const { [key]: deleted, ...remaining } = object;

    return remaining;
};
