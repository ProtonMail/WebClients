import { createStore } from 'redux';

import { registerStoreEffect } from './effect';

type State = { value: number };
type Action = { type: 'increment' } | { type: 'noop' };

const reducer = (state: State = { value: 0 }, action: Action): State => {
    switch (action.type) {
        case 'increment':
            return { value: state.value + 1 };
        default:
            return state;
    }
};

describe('`registerStoreEffect`', () => {
    test('does not fire on initial registration', () => {
        const store = createStore(reducer);
        const effect = jest.fn();

        registerStoreEffect(store, (state) => state.value, effect);

        expect(effect).not.toHaveBeenCalled();
    });

    test('fires with the new value when the selected value changes', () => {
        const store = createStore(reducer);
        const effect = jest.fn();

        registerStoreEffect(store, (state) => state.value, effect);
        store.dispatch({ type: 'increment' });

        expect(effect).toHaveBeenCalledTimes(1);
        expect(effect).toHaveBeenCalledWith(1);
    });

    test('does not fire again when the selected value is unchanged', () => {
        const store = createStore(reducer);
        const effect = jest.fn();

        registerStoreEffect(store, (state) => state.value, effect);
        store.dispatch({ type: 'noop' });

        expect(effect).not.toHaveBeenCalled();
    });

    test('stops firing after unsubscribing', () => {
        const store = createStore(reducer);
        const effect = jest.fn();

        const unsubscribe = registerStoreEffect(store, (state) => state.value, effect);
        unsubscribe();
        store.dispatch({ type: 'increment' });

        expect(effect).not.toHaveBeenCalled();
    });
});
