declare module '*.gif';
declare module '*.md';
declare module '*.png';
declare module '*.jpg';
declare module '*.ttf';
declare module '*.pdf';
declare module '*.scss';

// Raw text content — see packages/pack/webpack/{assets,css}.loader.js's REVEAL_JS_RAW_SOURCE rule.
declare module 'reveal.js/dist/reveal.js' {
    const content: string;
    export default content;
}
declare module 'reveal.js/dist/reveal.css' {
    const content: string;
    export default content;
}
declare module 'reveal.js/dist/theme/simple.css' {
    const content: string;
    export default content;
}
