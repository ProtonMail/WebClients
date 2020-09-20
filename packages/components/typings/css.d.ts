declare module 'csstype' {
    // eslint-disable-next-line no-unused-vars
    interface Properties<T> {
        // allow css variables
        [index: string]: unknown;
    }
}
