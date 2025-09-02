import { useEffect } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch as useDispatch, baseUseSelector as useSelector } from '@proton/react-redux-store';
import { CacheType, type ReducerValue } from '@proton/redux-utilities';
import type { PasswordPolicies } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { type AuthState, passwordPoliciesThunk, selectPasswordPolicies } from './index';

export const usePasswordPolicies = () => {
    const dispatch = useDispatch<ThunkDispatch<AuthState, any, Action>>();
    const value = useSelector<AuthState, ReducerValue<PasswordPolicies>>(selectPasswordPolicies)?.value;
    useEffect(() => {
        // This is re-fetched each time to make sure the values are up-to-date
        dispatch(passwordPoliciesThunk({ cache: CacheType.None })).catch(noop);
    }, []);
    return value;
};
