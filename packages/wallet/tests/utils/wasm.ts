type FreeableEntity<T> = T & {
    free: (...args: any[]) => any;
    [Symbol.dispose]: () => void;
};

/**
 * Used to bypass typecheck as Wasm classes come with a free() method and Symbol.dispose
 */
export const freeable = <T>(e: T): FreeableEntity<T> => {
    const f = e as FreeableEntity<T>;
    f.free = vi.fn();
    f[Symbol.dispose] = vi.fn();
    return f;
};
