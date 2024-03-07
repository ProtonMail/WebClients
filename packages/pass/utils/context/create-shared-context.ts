import type { Callback, Maybe, MaybeNull } from '@proton/pass/types';

export interface ContextHandler<T = any> {
    set: (ctx: T) => T;
    get: () => T;
    read: () => Maybe<T>;
    clear: () => void;
}

export enum InjectionMode {
    STRICT = 'get',
    LOOSE = 'read',
}

export type ContextValue<T extends ContextHandler = ContextHandler> = T extends ContextHandler<infer U> ? U : never;

/** The type `F` extends `Maybe<Callback>` to enhance automatic inference
 * when utilizing `withContext` on typed optional object methods. This avoids
 * the need for hard-casting. For instance:
 *
 * type Obj = { method?: (foo: number) => boolean };
 * const obj: Foo = { method: withContext((ctx, foo) => foo > 0.5) };
 *
 * In this example, `obj.method` benefits from automatic type inference
 * without requiring explicit casting */
export type ContextInjector<
    F extends Maybe<Callback>,
    T extends ContextHandler,
    Mode extends InjectionMode,
    Ctx = Mode extends 'get' ? ContextValue<T> : MaybeNull<ContextValue<T>>,
> = F extends Callback ? (ctx: Ctx, ...args: Parameters<F>) => ReturnType<F> : (ctx: Ctx) => void;

/** Creates a generic context with a simple setter/getter mechanism.
 * Useful when you want to create a global singleton context object
 * while avoiding "argument-drilling" */
export const contextHandlerFactory = <T>(id: string): ContextHandler<T> => {
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

/** Creates a higher-order context injector utility to streamline access to a
 * shared context and maintain type safety with typed callbacks. The injection
 * mode determines how the underlying context will be accessed :
 *
 * - `InjectionMode.STRICT`: callbacks will throw errors on empty contexts.
 * - `InjectionMode.LOOSE`: callbacks will receive a nullable context.
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
 * ``` */
export const contextInjectorFactory = <T extends ContextHandler, M extends InjectionMode>(context: T, mode: M) => {
    return <F extends Maybe<Callback> = Callback>(fn: ContextInjector<F, T, M>) =>
        ((...args: any[]) => {
            const value = context[mode]();
            return fn(value ?? null, ...(args as any));
        }) as F extends Maybe<infer U> ? U : F extends Callback ? F : never;
};
