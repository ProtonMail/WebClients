import type { Store } from 'redux';

type Selector<S, T> = (state: S) => T;

export const registerStoreEffect = <S, T>(store: Store<S>, selector: Selector<S, T>, effect: (value: T) => void): (() => void) => {
    let cache: T = selector(store.getState());

    return store.subscribe(() => {
        const value = selector(store.getState());
        if (value !== cache) {
            cache = value;
            effect(value);
        }
    });
};
