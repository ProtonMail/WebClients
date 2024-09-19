import { type Context, useRef } from 'react';

import type { MaybeNull } from '@proton/pass/types';

import { createUseContext } from './useContextFactory';

/** Creates a proxy to a React `Context` that always reflects the latest
 * context value, even when accessed outside of the React lifecycle. This
 * hook addresses scenarios where closures might capture stale context values,
 * ensuring that you always have access to the most up-to-date context data. */
export const useContextProxy = <T extends {}>(context: Context<MaybeNull<T>>) => {
    const ctx = createUseContext(context)();
    const ref = useRef(ctx);
    ref.current = ctx;

    return new Proxy<T>({} as T, {
        get: (_, prop) => ref.current[prop as keyof T],
    });
};
