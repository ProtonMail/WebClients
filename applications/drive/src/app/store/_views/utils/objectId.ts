import { useMemo } from 'react';

const objectIdMap = new WeakMap<any, number>();
let objectCount = 0;

/**
 * useMemoArrayNoMatterTheOrder does not change the result if the array
 * is different but contains the same objects even if the order of the
 * items is different.
 */
export function useMemoArrayNoMatterTheOrder<T>(items: T[]): T[] {
    const id = getArrayIdNoMatterTheOrder(items);
    return useMemo(() => items, [id]);
}

/**
 * getArrayIdNoMatterTheOrder returns the same unique ID if the array
 * is different but contains the same objects even if the order of the
 * items is different.
 */
export function getArrayIdNoMatterTheOrder(objects: any[]): string {
    return objects.map(getObjectId).sort().join('-');
}

/**
 * getObjectId returns the same unique ID for every passed `object`.
 */
export function getObjectId(object: any): string {
    if (!objectIdMap.has(object)) {
        objectIdMap.set(object, ++objectCount);
    }
    return (objectIdMap.get(object) as number).toString();
}
