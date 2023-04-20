import type { Callback } from '@proton/pass/types';
import { createSharedContextInjector } from '@proton/pass/utils/context';

import { WorkerContext } from './context';

export const withContext = createSharedContextInjector(WorkerContext);

export const onContextReady = <F extends Callback, P extends Parameters<F>, R extends ReturnType<F>>(
    fn: (...args: P) => R
): ((...args: P) => Promise<Awaited<R>>) =>
    withContext(async (ctx, ...args: any) => {
        await ctx.ensureReady();
        return fn(...args);
    }) as any;
