import type { Store } from 'redux';

import type { Maybe } from '@proton/pass/types';

type Selector<S, T> = (state: S) => T;

export const registerStoreEffect = <S, T>(
    store: Store<S>,
    selector: Selector<S, T>,
    effect: (value: T) => void
): (() => void) => {
    let cache: Maybe<T>;

    return store.subscribe(() => {
        const value = selector(store.getState());
        if (value !== cache) {
            cache = value;
            effect(value);
        }
    });
};
