import { useCallback, useEffect } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';
import debounce from 'lodash/debounce';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { CacheType } from '@proton/redux-utilities';
import type { CalendarBootstrap } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { type CalendarsBootstrapState, calendarBootstrapThunk, selectCalendarsBootstrap } from './index';

export const useGetCalendarBootstrap = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<CalendarsBootstrapState, ProtonThunkArguments, Action>>();
    return useCallback(
        (calendarID: string, cache?: CacheType) => dispatch(calendarBootstrapThunk({ calendarID, cache })),
        [dispatch]
    );
};

const fetchWithClickRetry = (fn: () => Promise<any>) => {
    let removeListener = noop;

    let unmounted = false;
    const debouncedFetch = debounce(
        () => {
            fn()
                .then(() => {
                    // If it succeeds we can remove the listener
                    removeListener();
                })
                .catch(noop);
        },
        500,
        { leading: true }
    );

    fn().catch(() => {
        if (unmounted) {
            return;
        }
        document.addEventListener('click', debouncedFetch);
        document.addEventListener('touchstart', debouncedFetch);
        removeListener = () => {
            document.removeEventListener('click', debouncedFetch);
            document.removeEventListener('touchstart', debouncedFetch);
            removeListener = noop;
        };
    });

    return () => {
        unmounted = true;
        debouncedFetch.cancel();
        removeListener();
    };
};

export const useCalendarBootstrap = (calendarID: string | undefined): [CalendarBootstrap | undefined, boolean] => {
    const state = baseUseSelector(selectCalendarsBootstrap);
    const getCalendarBoostrap = useGetCalendarBootstrap();

    useEffect(() => {
        if (!calendarID) {
            return;
        }

        const fetch = () => {
            return getCalendarBoostrap(calendarID);
        };

        // If the calendar bootstrap model fails, setup a listener to retry fetching it on any user interaction.
        // This is because the calendar bootstrap is a critical model that needs to exist in order for event
        // creation and event reading to exist. We base it on user activity instead of automatic retry to avoid
        // spamming the API.
        const unsubscribe = fetchWithClickRetry(fetch);
        return () => {
            unsubscribe();
        };
    }, [calendarID]);

    if (!calendarID) {
        return [undefined, false];
    }

    const modelState = state[calendarID];

    const value = modelState?.value;
    const loading = value === undefined || modelState?.loading === true;
    return [value, loading];
};

export const useReadCalendarBootstrap = () => {
    const store = baseUseStore();
    return useCallback(
        (calendarID: string) => {
            const state = selectCalendarsBootstrap(store.getState());
            return state[calendarID]?.value;
        },
        [store]
    );
};
