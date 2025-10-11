declare module 'csstype' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Properties<T> {
        /** Allow custom css variables. */
        [key: string]: unknown;
    }
}
