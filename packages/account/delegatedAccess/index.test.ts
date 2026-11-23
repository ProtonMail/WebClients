import type { UnknownAction } from '@reduxjs/toolkit';

import {
    type DelegatedAccessState,
    delegatedAccessActions,
    delegatedAccessReducer,
    selectIsDelegatedAccessSupported,
    selectIsOutgoingDelegatedAccessSupported,
} from './index';

const getTestState = (...actions: UnknownAction[]) => {
    const reducer = delegatedAccessReducer.delegatedAccess;
    const delegatedAccess = actions.reduce(
        (state, action) => reducer(state, action),
        reducer(undefined, { type: 'init' })
    );
    return { delegatedAccess } as DelegatedAccessState;
};

describe('delegatedAccess support flags', () => {
    it('defaults both flags to unsupported', () => {
        const state = getTestState();

        expect(selectIsDelegatedAccessSupported(state)).toBe(false);
        expect(selectIsOutgoingDelegatedAccessSupported(state)).toBe(false);
    });

    it('sets the outgoing flag without affecting the full support flag', () => {
        const state = getTestState(delegatedAccessActions.setOutgoingSupportedInApp(true));

        expect(selectIsOutgoingDelegatedAccessSupported(state)).toBe(true);
        expect(selectIsDelegatedAccessSupported(state)).toBe(false);
    });

    it('sets the full support flag without affecting the outgoing flag', () => {
        const state = getTestState(delegatedAccessActions.setSupportedInApp(true));

        expect(selectIsDelegatedAccessSupported(state)).toBe(true);
        expect(selectIsOutgoingDelegatedAccessSupported(state)).toBe(false);
    });

    it('can turn the outgoing flag back off', () => {
        const state = getTestState(
            delegatedAccessActions.setOutgoingSupportedInApp(true),
            delegatedAccessActions.setOutgoingSupportedInApp(false)
        );

        expect(selectIsOutgoingDelegatedAccessSupported(state)).toBe(false);
    });
});
