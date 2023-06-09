import type { RecursivePartial } from '@proton/pass/types';

import { isObject } from './is-object';

type MergeOptions = { excludeEmpty: boolean };
type Obj = { [key: PropertyKey]: any };

export const merge = <Original extends Obj, Overwrite extends Obj>(
    original: Original,
    overwrite: Overwrite,
    options: MergeOptions = { excludeEmpty: false }
): Original & Overwrite => {
    if ((original as any) === (overwrite as any)) return original as any;
    const keys = Object.keys(overwrite);
    const filteredKeys = options.excludeEmpty ? keys.filter((key) => Boolean(overwrite[key])) : keys;

    return filteredKeys.reduce(
        (overwritten, key) => ({
            ...overwritten,
            [key]:
                isObject(original[key]) && isObject(overwrite[key])
                    ? merge(original[key], overwrite[key])
                    : overwrite[key],
        }),
        original
    ) as any;
};

/* Type safe merge functions that preserve the original input type */
export const fullMerge: <T extends Obj>(original: T, overwrite: T) => T = merge;
export const partialMerge: <T extends Obj>(original: T, overwrite: RecursivePartial<T>) => T = merge;
