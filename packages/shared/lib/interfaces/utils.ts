export type SimpleMap<T> = { [key: string]: T | undefined };

export type LoadingMap = { [key: string]: boolean | undefined };

export type RequireOnly<T, Keys extends keyof T> = Partial<T> & Required<Pick<T, Keys>>;

export type RequireSome<T, Keys extends keyof T> = T & Required<Pick<T, Keys>>;

export type Unwrap<T> = T extends Promise<infer U>
    ? U
    : T extends (...args: any) => Promise<infer U>
    ? U
    : T extends (...args: any) => infer U
    ? U
    : T;
