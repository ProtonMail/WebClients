declare module 'csstype' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Properties<T> {
        // allow css variables
        [index: string]: unknown;
    }
}
