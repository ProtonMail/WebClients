import { useEffect, useMemo } from 'react';

import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import { baseUseDispatch, baseUseSelector } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar/Subscription';

import type { CalendarsState } from '../calendars';
import { type CalendarSubscriptionsState, selectCalendarSubscriptions, watchCalendarSubscriptionsThunk } from './index';

export const useSubscribedCalendars = (calendars: VisualCalendar[], loadingCalendars = false) => {
    const subscriptions = baseUseSelector(selectCalendarSubscriptions);
    const dispatch =
        baseUseDispatch<ThunkDispatch<CalendarSubscriptionsState & CalendarsState, ProtonThunkArguments, Action>>();

    useEffect(() => dispatch(watchCalendarSubscriptionsThunk()), []);

    const subscribedCalendars = useMemo(
        () =>
            calendars.map((calendar): VisualCalendar | SubscribedCalendar => {
                const SubscriptionParameters = subscriptions[calendar.ID]?.value;
                return SubscriptionParameters ? { ...calendar, SubscriptionParameters } : calendar;
            }),
        [calendars, subscriptions]
    );

    // A calendar has no entry until its first fetch succeeds or fails
    const loading = loadingCalendars || calendars.some(({ ID }) => !subscriptions[ID]);

    return { subscribedCalendars, loading };
};
