import { type Context, useContext } from 'react';

export const createUseContext = <T>(ctx: Context<T>): (() => NonNullable<T>) => {
    const useSafeContext = (): NonNullable<T> => {
        const value = useContext(ctx);
        if (!value) throw new Error(`${ctx.displayName} not initialized`);
        return value;
    };

    return useSafeContext;
};
