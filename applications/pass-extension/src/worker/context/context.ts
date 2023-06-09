import type { Callback } from '@proton/pass/types';
import { createSharedContext } from '@proton/pass/utils/context';
import { createSharedContextInjector } from '@proton/pass/utils/context';

import type { WorkerContextInterface } from './types';

export const WorkerContext = createSharedContext<WorkerContextInterface>('worker');

export const withContext = createSharedContextInjector(WorkerContext);

export const onContextReady = <F extends Callback, P extends Parameters<F>, R extends ReturnType<F>>(
    fn: (...args: P) => R
): ((...args: P) => Promise<Awaited<R>>) =>
    withContext(async (ctx, ...args: any) => {
        await ctx.ensureReady();
        return fn(...args);
    }) as any;
