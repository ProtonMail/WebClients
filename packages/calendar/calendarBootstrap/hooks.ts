import { useCallback, useEffect } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { CalendarBootstrap } from '@proton/shared/lib/interfaces/calendar';
import noop from '@proton/utils/noop';

import { type CalendarsBootstrapState, calendarBootstrapThunk, selectCalendarsBootstrap } from './index';

export const useGetCalendarBootstrap = () => {
    const dispatch = baseUseDispatch<ThunkDispatch<CalendarsBootstrapState, ProtonThunkArguments, Action>>();
    return useCallback((calendarID: string) => dispatch(calendarBootstrapThunk({ calendarID })), [dispatch]);
};

export const useCalendarBootstrap = (calendarID: string | undefined): [CalendarBootstrap | undefined, boolean] => {
    const state = baseUseSelector(selectCalendarsBootstrap);
    const getCalendarBoostrap = useGetCalendarBootstrap();

    useEffect(() => {
        if (!calendarID) {
            return;
        }
        getCalendarBoostrap(calendarID).catch(noop);
    }, [calendarID]);

    if (!calendarID) {
        return [undefined, false];
    }

    const value = state[calendarID]?.value;
    return [value, value === undefined];
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
