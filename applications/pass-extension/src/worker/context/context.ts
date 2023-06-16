import type { Callback } from '@proton/pass/types';
import { createSharedContext, createSharedContextInjector } from '@proton/pass/utils/context';

import type { WorkerContextInterface } from './types';

export const WorkerContext = createSharedContext<WorkerContextInterface>('worker');

export const withContext = createSharedContextInjector(WorkerContext);

export const onContextReady = <F extends Callback, P extends Parameters<F>, R extends ReturnType<F>>(
    fn: (ctx: WorkerContextInterface, ...args: P) => R
): ((...args: P) => Promise<Awaited<R>>) =>
    withContext(async (ctx, ...args: any) => {
        await ctx.ensureReady();
        return fn(ctx, ...args);
    }) as any;
