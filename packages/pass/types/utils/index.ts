export type Callback<T extends any[] = any[], R = any> = (...args: T) => R;

export type Maybe<T> = T | undefined;
export type MaybeNull<T> = T | null;
export type MaybeArray<T> = T | T[];
export type Unpack<T> = T extends (infer U)[] ? U : never;

export type RequiredNonNull<T> = Omit<T, keyof T> & { [P in keyof T]-?: NonNullable<T[P]> };
export type RequiredProps<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };

export type DefinedPropertiesOnly<S extends {}> = Pick<S, DefinedKeys<S>>;
export type DefinedKeys<S extends {}, K = keyof S> = Extract<
    K,
    K extends keyof S ? (S[K] extends undefined ? never : K) : never
>;

export type ColorRGB = `${number} ${number} ${number}`;
