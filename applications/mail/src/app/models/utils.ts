export type RequireOnly<T, Keys extends keyof T> = Partial<T> & Required<Pick<T, Keys>>;
export type RequireSome<T, Keys extends keyof T> = T & Required<Pick<T, Keys>>;
export type Unwrap<T> = T extends Promise<infer U>
    ? U
    : T extends (...args: any) => Promise<infer U>
    ? U
    : T extends (...args: any) => infer U
    ? U
    : T;

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

export type MapLoading = { [key: string]: boolean | undefined };
