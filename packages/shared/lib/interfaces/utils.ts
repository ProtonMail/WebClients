export type SimpleMap<T> = { [key: string]: T | undefined };

export type MaybeArray<T> = T[] | T;

export type LoadingMap = SimpleMap<boolean>;

export type RequireOnly<T, Keys extends keyof T> = Partial<T> & Required<Pick<T, Keys>>;

export type RequireSome<T, Keys extends keyof T> = T & Required<Pick<T, Keys>>;

export type Unwrap<T> =
    T extends Promise<infer U>
        ? U
        : T extends (...args: any) => Promise<infer U>
          ? U
          : T extends (...args: any) => infer U
            ? U
            : T;

export type Nullable<T> = T | null;

/**
 * Allow interface to have "specific" optinal entries.
 * Works the following : Optional<MyInterface, 'keya' | 'keyb'>
 */
export type Optional<T extends object, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

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

/**
 * Makes all properties of the object required.
 */
export type StrictRequired<T> = {
    [P in keyof T]-?: NonNullable<T[P]>;
};
