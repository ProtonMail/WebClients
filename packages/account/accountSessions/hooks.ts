import { useCallback } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import { signoutAction } from '../authenticationService';
import { accountSessionsEvent } from './events';
import { type AccountSessions, type AccountSessionsState, selectAccountSessions } from './slice';

export const useAccountSessions = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<AccountSessionsState, ProtonThunkArguments, Action>>();
    const state = baseUseSelector<AccountSessionsState, AccountSessions>(selectAccountSessions);

    return {
        state,
        // If there are more sessions than just self, we display the in-app account switcher list
        hasList: state.meta.support && state.value.length > 1,
        // If in-app account switcher is supported and self exists
        hasAddAccount: state.meta.support && state.value.length > 0,
        actions: {
            ping: useCallback(() => {
                dispatch(accountSessionsEvent());
            }, []),
            signOut: useCallback((options: { clearDeviceRecovery: boolean; logoutRedirectUrl?: string }) => {
                return dispatch(
                    signoutAction({
                        clearDeviceRecovery: options.clearDeviceRecovery,
                        logoutRedirectUrl: options.logoutRedirectUrl,
                    })
                );
            }, []),
            signOutAll: useCallback((sessions: (typeof state)['value'], logoutRedirectUrl?: string) => {
                return dispatch(
                    signoutAction({
                        clearDeviceRecovery: false,
                        type: 'all',
                        sessions,
                        logoutRedirectUrl,
                    })
                );
            }, []),
        },
    };
};
