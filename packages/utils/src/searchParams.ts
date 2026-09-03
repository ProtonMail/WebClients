export type SearchParamString<T extends Record<string, any>> = {
    [K in keyof T]-?: T[K] extends readonly any[] ? `${K & string}=${T[K][number]}` : `${K & string}=${T[K]}`;
}[keyof T];

type MultipleValueParamFormat = 'repeat' | 'comma-separated' | 'json-array';
type SearchParamStringOptions = {
    multiple?: MultipleValueParamFormat;
};

const getArrayValue = (
    key: string,
    values: (string | number)[],
    strategy: MultipleValueParamFormat = 'repeat'
): [string, string][] => {
    switch (strategy) {
        case 'repeat':
            return values.map((value) => [key, `${value}`]);
        case 'comma-separated':
            return [[key, values.join(',')]];
        case 'json-array':
            return [[key, JSON.stringify(values)]];
    }
};
/**
 * Serializes an object into an application/x-www-form-urlencoded query string.
 *
 * Built on the standard `URLSearchParams` API, so keys and values are properly
 * percent-encoded (spaces become `+`, special characters are escaped).
 *
 * Behaviour:
 * - Scalar values are stringified and appended as `key=value` pairs.
 * - Array values produce a repeated key, one pair per element
 *   (e.g. `{ id: [1, 2] }` becomes `id=1&id=2`).
 * - Object values are JSON-stringified (e.g. `{ meta: { open: true } }`
 *   becomes `meta=%7B%22open%22%3Atrue%7D`).
 * - Falsy values (`null`, `undefined`, `false`, `''`, `NaN`) are dropped,
 *   except `0` which is kept.
 * - Empty arrays are dropped.
 *
 * The return type is refined to a template literal (`SearchParamString<T>`),
 * e.g. `` `a=${number}` `` | `` `b=${string}` ``, but is always assignable to `string`.
 *
 * @param obj - any object whose entries should be converted to a query string
 * @returns the URL-encoded query string (without a leading `?`)
 *
 * @example
 * getSearchParamString({ a: 'foo', b: 123, c: [1, 2], skip: null })
 * // => 'a=foo&b=123&c=1&c=2'
 */
export function getSearchParamString<T extends Record<string, any>>(
    obj: T,
    { multiple }: SearchParamStringOptions = { multiple: 'repeat' }
): SearchParamString<T> {
    const polishedObject = Object.entries(obj)
        .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : value || value === 0))
        .flatMap(([key, value]) => {
            if (Array.isArray(value)) {
                return getArrayValue(key, value, multiple);
            }
            if (value !== null && typeof value === 'object') {
                return [[key, JSON.stringify(value)]];
            }

            return [[key, `${value}`]];
        });

    return new URLSearchParams(polishedObject).toString() as SearchParamString<T>;
}
