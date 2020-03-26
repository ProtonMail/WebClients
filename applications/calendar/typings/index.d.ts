declare module '*.svg' {
    const src: string;
    export default src;
}

declare module '*.md' {
    const value: any;
    export default value;
}

declare const PL_IS_STANDALONE: boolean;
