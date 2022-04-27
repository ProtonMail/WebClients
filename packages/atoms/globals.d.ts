/**
 * Can't call this index.d.ts, otherwise it conflicts with index.ts
 */

declare module '*.mdx' {
    const mdx: any;
    export default mdx;
}

declare module '*.png' {
    const img: string;
    export default img;
}
