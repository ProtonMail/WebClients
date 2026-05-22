import { useMemo } from 'react';
import type { Selector, TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';

import type { LumoDispatch, LumoState } from './store';

type SelectorCreator<TDeps extends any[], TResult> = (...args: TDeps) => Selector<LumoState, TResult>;

export const useLumoDispatch: () => LumoDispatch = baseUseDispatch;
export const useLumoSelector: TypedUseSelectorHook<LumoState> = baseUseSelector;
export const useLumoStore: () => { getState: () => LumoState; dispatch: LumoDispatch } = baseUseStore as any;

export const useLumoMemoSelector = <TDeps extends any[], TResult>(
    selectorFactory: SelectorCreator<TDeps, TResult>,
    deps: TDeps
): TResult => {
    const selector = useMemo(() => selectorFactory(...deps), deps);
    return useLumoSelector(selector);
};
