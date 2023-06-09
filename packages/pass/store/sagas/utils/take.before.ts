import type { Action, AnyAction } from 'redux';
import type { ActionPattern } from 'redux-saga/effects';
import { call, fork, select, take } from 'redux-saga/effects';

import type { State } from '../../types';

type BeforeOptimisticsWorker<A extends Action, R extends any[]> = (action: A, state: State, ...args: R) => any;

/* When using Redux Sagas, the sagas are typically executed after the action
 * has been processed by the reducers. In certain scenarios, such as optimistic
 * actions that modify the state optimistically before the sagas run, there is
 * a possibility of losing the previous state when running selectors in the sagas.
 * To overcome this limitation, we have the following utility: */
export function* takeBefore<A extends Action, R extends any[], F extends BeforeOptimisticsWorker<A, R>>(
    pattern: ActionPattern<A>,
    fn: F,
    ...args: R
) {
    while (true) {
        const state = (yield select()) as State;
        const action = (yield take('*')) as AnyAction;
        if (typeof pattern === 'function' && pattern(action)) {
            yield call<F>(fn, ...([action, state, ...args] as Parameters<F>));
        }
    }
}

/* same but non-blocking */
export function* takeEveryBefore<A extends Action, R extends any[], F extends BeforeOptimisticsWorker<A, R>>(
    pattern: ActionPattern<A>,
    fn: F,
    ...args: R
) {
    while (true) {
        const state = (yield select()) as State;
        const action = (yield take('*')) as AnyAction;
        if (typeof pattern === 'function' && pattern(action)) {
            yield fork<F>(fn, ...([action, state, ...args] as Parameters<F>));
        }
    }
}
