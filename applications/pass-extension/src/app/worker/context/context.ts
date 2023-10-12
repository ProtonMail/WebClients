import type { Callback, Maybe } from '@proton/pass/types';
import type { SharedContext, SharedContextInjector } from '@proton/pass/utils/context';
import { createSharedContext, createSharedContextInjector } from '@proton/pass/utils/context';

import type { WorkerContextInterface } from './types';

export const WorkerContext = createSharedContext<WorkerContextInterface>('worker');
export const withContext = createSharedContextInjector(WorkerContext);

export const onContextReady = <F extends Maybe<Callback>>(
    fn: SharedContextInjector<F, SharedContext<WorkerContextInterface>>
) => {
    const injector = (async (ctx: WorkerContextInterface, ...args: any[]) => {
        await ctx.ensureReady();
        return fn(ctx, ...args);
    }) as SharedContextInjector<F, SharedContext<WorkerContextInterface>>;

    return withContext<F>(injector);
};
