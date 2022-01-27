export type SimpleMap<T> = { [key: string]: T | undefined };

export type LoadingMap = SimpleMap<boolean>;

export type RequireOnly<T, Keys extends keyof T> = Partial<T> & Required<Pick<T, Keys>>;

export type RequireSome<T, Keys extends keyof T> = T & Required<Pick<T, Keys>>;

export type Unwrap<T> = T extends Promise<infer U>
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
