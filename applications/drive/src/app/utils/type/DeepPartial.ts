/**
 * Like TypeScript's `Partial<T>` utility type, but recurses into arrays and objects.
 *
 * ```typescript
 * // For example, with the following type
 * type Example = { a: { b: number[], c: string }};
 * type PartialExample = { a?: { b: number[], c: string }};
 * type DeepPartialExample = { a?: { b?: (number | undefined)[], c?: string }};
 * ```
 */
export type DeepPartial<T> = T extends (infer E)[]
    ? DeepPartial<E>[]
    : T extends object
      ? {
            [K in keyof T]?: DeepPartial<T[K]>;
        }
      : T | undefined;
