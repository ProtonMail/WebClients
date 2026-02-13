export const ENABLE_FOUNDATION_SEARCH = true && isCompatible();

function isCompatible(): boolean {
    // indexing relies on Web Locks API
    // https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API
    return 'locks' in navigator;
}
