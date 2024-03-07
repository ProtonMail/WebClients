import type { Callback, Maybe } from '@proton/pass/types';
import type { ContextHandler, ContextInjector } from '@proton/pass/utils/context';
import { InjectionMode, contextHandlerFactory, contextInjectorFactory } from '@proton/pass/utils/context';

import type { WorkerContextInterface } from './types';

export const WorkerContext = contextHandlerFactory<WorkerContextInterface>('worker');
export const withContext = contextInjectorFactory(WorkerContext, InjectionMode.STRICT);

export const onContextReady = <
    F extends Maybe<Callback>,
    Injector extends ContextInjector<F, ContextHandler<WorkerContextInterface>, InjectionMode.STRICT>,
>(
    fn: Injector
) => {
    const injector = (async (ctx: WorkerContextInterface, ...args: any[]) => {
        await ctx.ensureReady();
        return fn(ctx, ...args);
    }) as Injector;

    return withContext<F>(injector);
};
