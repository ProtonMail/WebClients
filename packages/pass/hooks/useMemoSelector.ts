import { useMemo } from 'react';
import { type Selector, useSelector } from 'react-redux';

import type { State } from '@proton/pass/store/types';

type SelectorCreator<TDeps extends any[], TResult> = (...args: TDeps) => Selector<State, TResult>;

export const useMemoSelector = <TDeps extends any[], TResult>(
    selectorFactory: SelectorCreator<TDeps, TResult>,
    deps: TDeps
): TResult => {
    const selector = useMemo(() => selectorFactory(...deps), deps);
    return useSelector(selector);
};
