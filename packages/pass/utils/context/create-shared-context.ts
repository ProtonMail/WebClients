import type { Callback, Maybe } from '@proton/pass/types';

export interface SharedContext<T = any> {
    set: (ctx: T) => T;
    get: () => T;
    read: () => Maybe<T>;
    clear: () => void;
}

export type SharedContextValue<T extends SharedContext = SharedContext> = T extends SharedContext<infer U> ? U : never;

/* F extends `Maybe<Callback>` in order to improve automatic inference
 * when using `withContext` on typed optional object methods. This avoids
 * having to hard-cast - ie :
 *   type Obj = { method?: (foo: number) => boolean }
 *   const obj: Foo = { method: withContext((ctx, foo) => foo > 0.5) }
 */
export type SharedContextInjector<F extends Maybe<Callback>, T extends SharedContext> = F extends Callback
    ? (ctx: SharedContextValue<T>, ...args: Parameters<F>) => ReturnType<F>
    : (ctx: SharedContextValue<T>) => void;

/**
 * Creates a generic context with a simple
 * setter/getter mechanism - Useful when you
 * want to create a global singleton context object
 * while avoiding "argument-drilling"
 */
export const createSharedContext = <T>(id: string): SharedContext<T> => {
    const ref: { ctx?: T } = {};

    const set = (ctx: T) => (ref.ctx = ctx);

    const get = (): T => {
        if (ref.ctx === undefined) {
            throw new Error(`Context#${id} has not been initialized`);
        }

        return ref.ctx;
    };

    const read = (): Maybe<T> => ref.ctx;
    const clear = () => {
        delete ref.ctx;
        ref.ctx = undefined;
    };

    return { set, get, read, clear };
};

/**
 * Utility for creating a Higher-order context injector
 * to avoid calling context.get() everywhere. Maintains strong
 * type-safety when used with typed callbacks.
 *
 * usage:
 * ```
 * const withCtx = createSharedContextInjector(sharedContext);
 * const fn: (foo: string) => boolean = withCtx((ctx, check: boolean) => {
 *   // do something with the context;
 *   return check;
 * });
 *
 * fn(true);
 * ```
 */
export const createSharedContextInjector = <T extends SharedContext>(context: T) => {
    return <F extends Maybe<Callback> = Callback>(fn: SharedContextInjector<F, T>) =>
        ((...args: any[]) => {
            const value = context.get();
            return fn(value, ...(args as any));
        }) as F extends Maybe<infer U> ? U : F extends Callback ? F : never;
};
