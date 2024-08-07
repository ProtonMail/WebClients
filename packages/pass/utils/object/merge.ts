import type { RecursivePartial } from '@proton/pass/types';

import { isObject } from './is-object';

type MergeOptions = { excludeEmpty: boolean };
type Obj = { [key: PropertyKey]: any };

const isEmptyValue = (value: any) =>
    value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value));

/** `merge` does not return a new object reference. It overwrites the `original`
 * in-place. As such, use carefully when merging over constants as it will mutate */
const merge = <Original extends Obj, Overwrite extends Obj>(
    original: Original,
    overwrite: Overwrite,
    options: MergeOptions = { excludeEmpty: false }
): Original & Overwrite => {
    if ((original as any) === (overwrite as any)) return original as any;
    const keys = Object.keys(overwrite);
    const filteredKeys = options.excludeEmpty ? keys.filter((key) => !isEmptyValue(overwrite[key])) : keys;

    return filteredKeys.reduce(
        (overwritten, key) => ({
            ...overwritten,
            [key]:
                isObject(original[key]) && isObject(overwrite[key])
                    ? merge(original[key], overwrite[key], options)
                    : overwrite[key],
        }),
        original
    ) as any;
};

/* Type safe merge functions that preserve the original input type */
const fullMerge: <T extends Obj>(original: T, overwrite: T, options?: MergeOptions) => T = merge;
const partialMerge: <T extends Obj>(original: T, overwrite: RecursivePartial<T>, opts?: MergeOptions) => T = merge;

export { fullMerge, merge, partialMerge };
