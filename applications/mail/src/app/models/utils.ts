export interface Cache<Value> {
    has: (key: string) => boolean;
    get: (key: string) => Value | undefined;
    set: (key: string, value: Value) => void;
    toObject: () => { [key: string]: Value | undefined };
    delete: (key: string) => void;
    subscribe: (handler: (key: string) => void) => () => void;
    reset: () => void;
}

export type RequireOnly<T, Keys extends keyof T> = Partial<T> & Required<Pick<T, Keys>>;
export type RequireSome<T, Keys extends keyof T> = T & Required<Pick<T, Keys>>;

export interface Breakpoints {
    breakpoint: string;
    isDesktop: boolean;
    isTablet: boolean;
    isMobile: boolean;
    isTinyMobile: boolean;
    isNarrow: boolean;
}

export interface WindowSize {
    height: number;
    width: number;
}
