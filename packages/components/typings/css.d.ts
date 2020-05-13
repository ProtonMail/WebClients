declare module 'csstype' {
    interface Properties<T> {
        // allow css variables
        [index: string]: unknown;
    }
}
