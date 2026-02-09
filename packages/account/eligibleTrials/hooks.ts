import { useCallback } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store';

import {
    type EligibleTrials,
    type EligibleTrialsState,
    type EligibleTrialsThunkArguments,
    eligibleTrialsDefaultValue,
    eligibleTrialsThunk,
    selectEligibleTrials,
} from './index';

/**
 * Hook to access eligible trials data with optimistic defaults
 *
 * Returns:
 * - eligibleTrials: The current eligible trials data (defaults if not yet fetched)
 * - loading: Whether the data is being fetched
 * - fetchEligibleTrials: Function to fetch trials for a referral identifier
 */
export const useEligibleTrials = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<EligibleTrialsState, EligibleTrialsThunkArguments, Action>>();
    const state = baseUseSelector(selectEligibleTrials);

    const eligibleTrials: EligibleTrials = state?.value ?? eligibleTrialsDefaultValue;
    const loading = state?.value === undefined && state?.error === undefined;

    const fetchEligibleTrials = useCallback(
        (referralIdentifier: string) => {
            return dispatch(eligibleTrialsThunk({ thunkArg: referralIdentifier }));
        },
        [dispatch]
    );

    return {
        eligibleTrials,
        loading,
        fetchEligibleTrials,
    };
};
