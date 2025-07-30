import { useCallback, useMemo } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import { listIncomingDelegatedAccess } from './incomingActions';
import { type DelegatedAccessState, selectIncomingDelegatedAccess, selectOutgoingDelegatedAccess } from './index';
import { listOutgoingDelegatedAccess } from './outgoingActions';

export const useOutgoingDelegatedAccess = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<DelegatedAccessState, ProtonThunkArguments, Action>>();
    const outgoingState = baseUseSelector<DelegatedAccessState, ReturnType<typeof selectOutgoingDelegatedAccess>>(
        selectOutgoingDelegatedAccess
    );

    const getOutgoingDelegatedAccess = useCallback(() => {
        return dispatch(listOutgoingDelegatedAccess());
    }, []);

    return {
        state: useMemo(
            () => [outgoingState.value ?? [], outgoingState.value === undefined] as const,
            [outgoingState.value]
        ),
        getOutgoingDelegatedAccess,
    };
};

export const useIncomingDelegatedAccess = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<DelegatedAccessState, ProtonThunkArguments, Action>>();
    const incomingState = baseUseSelector<DelegatedAccessState, ReturnType<typeof selectIncomingDelegatedAccess>>(
        selectIncomingDelegatedAccess
    );

    return {
        state: useMemo(
            () => [incomingState.value ?? [], incomingState.value === undefined] as const,
            [incomingState.value]
        ),
        getIncomingDelegatedAccess: useCallback(() => {
            return dispatch(listIncomingDelegatedAccess());
        }, []),
    };
};
