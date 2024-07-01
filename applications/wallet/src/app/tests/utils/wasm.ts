type FreeableEntity<T> = T & { free: (...args: any[]) => any };

/**
 * Used to bypass typecheck as Wasm classes come with a free() method
 */
export const freeable = <T>(e: T): FreeableEntity<T> => {
    const f = e as FreeableEntity<T>;
    f.free = vi.fn();
    return f;
};
