import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { act, renderHook, waitFor } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { getTestStore } from '@proton/redux-utilities/testing/getTestStore';
import { CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { getCalendarHasSubscriptionParameters } from '@proton/shared/lib/calendar/subscribe/helpers';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { CalendarWithOwnMembers, VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { CalendarMember } from '@proton/shared/lib/interfaces/calendar/CalendarMember';
import type { CalendarSubscription, SubscribedCalendar } from '@proton/shared/lib/interfaces/calendar/Subscription';

import { calendarServerEvent } from '../calendarServerEvent';
import { calendarsActions, calendarsReducer } from '../calendars';
import { useSubscribedCalendars } from './hooks';
import { calendarSubscriptionThunk, calendarSubscriptionsReducer } from './index';

const getSubscribedCalendar = (ID: string) =>
    ({
        ID,
        Type: CALENDAR_TYPE.SUBSCRIPTION,
        Members: [{ ID: `${ID}-member`, Name: ID } as CalendarMember],
    }) as VisualCalendar;

const getSubscription = (CalendarID: string) => ({ CalendarID, URL: `https://${CalendarID}` }) as CalendarSubscription;

const withParameters = (calendars: (VisualCalendar | SubscribedCalendar)[]) =>
    calendars.filter(getCalendarHasSubscriptionParameters).map(({ ID }) => ID);

const createStore = (api: jest.Mock, calendars: VisualCalendar[]) =>
    getTestStore({
        reducer: { ...calendarsReducer, ...calendarSubscriptionsReducer },
        preloadedState: { calendars: getModelState(calendars as CalendarWithOwnMembers[]), calendarSubscriptions: {} },
        extraThunkArguments: { api } as unknown as ProtonThunkArguments,
    }).store;

const setup = (api: jest.Mock, calendars: VisualCalendar[], store = createStore(api, calendars)) => {
    const wrapper = ({ children }: { children: ReactNode }) => (
        <Provider context={ProtonStoreContext} store={store}>
            {children}
        </Provider>
    );
    const rendered = renderHook(({ calendars }) => useSubscribedCalendars(calendars), {
        initialProps: { calendars },
        wrapper,
    });
    // The apps pass the subscribed calendars from the calendars slice
    const setCalendars = (calendars: VisualCalendar[]) => {
        act(() => {
            store.dispatch(calendarsActions.updateCalendars(calendars as CalendarWithOwnMembers[]));
        });
        rendered.rerender({ calendars });
    };
    const callsFor = (ID: string) => api.mock.calls.filter(([{ url }]) => url.includes(`/${ID}/`));
    return { store, callsFor, setCalendars, ...rendered };
};

describe('useSubscribedCalendars', () => {
    it('follows the calendars it is given', async () => {
        const first = getSubscribedCalendar('first');
        const second = getSubscribedCalendar('second');
        const api = jest.fn(({ url }: { url: string }) =>
            Promise.resolve({ CalendarSubscription: getSubscription(url.split('/')[2]) })
        );
        const { result, setCalendars } = setup(api, [first]);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.subscribedCalendars).toEqual([
            { ...first, SubscriptionParameters: getSubscription('first') },
        ]);

        // A new calendar is listed right away, and loading until its subscription arrives
        setCalendars([first, second]);
        expect(result.current.subscribedCalendars.map(({ ID }) => ID)).toEqual(['first', 'second']);
        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(withParameters(result.current.subscribedCalendars)).toEqual(['first', 'second']);

        setCalendars([second]);
        expect(withParameters(result.current.subscribedCalendars)).toEqual(['second']);
    });

    it('does not add a calendar removed while its subscription is fetched', async () => {
        const first = getSubscribedCalendar('first');
        const second = getSubscribedCalendar('second');
        let resolveSecond: (value: unknown) => void = () => {};
        const api = jest.fn(({ url }: { url: string }) =>
            url.includes('/second/')
                ? new Promise((resolve) => {
                      resolveSecond = resolve;
                  })
                : Promise.resolve({ CalendarSubscription: getSubscription('first') })
        );
        const { result, setCalendars } = setup(api, [first]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        // The second calendar shows up, then goes away before its subscription comes back
        setCalendars([first, second]);
        await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
        setCalendars([first]);
        await act(async () => {
            resolveSecond({ CalendarSubscription: getSubscription('second') });
        });

        expect(withParameters(result.current.subscribedCalendars)).toEqual(['first']);
    });

    it('fetches a new calendar once while the list changes again', async () => {
        const first = getSubscribedCalendar('first');
        const second = getSubscribedCalendar('second');
        let resolveSecond: (value: unknown) => void = () => {};
        const api = jest.fn(({ url }: { url: string }) =>
            url.includes('/second/')
                ? new Promise((resolve) => {
                      resolveSecond = resolve;
                  })
                : Promise.resolve({ CalendarSubscription: getSubscription('first') })
        );
        const { result, setCalendars, callsFor } = setup(api, [first]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        // The list gets a new reference while the second calendar's subscription is still loading
        setCalendars([first, second]);
        await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
        setCalendars([first, second]);
        await act(async () => {
            resolveSecond({ CalendarSubscription: getSubscription('second') });
        });

        expect(callsFor('second')).toHaveLength(1);
        expect(withParameters(result.current.subscribedCalendars)).toEqual(['first', 'second']);
    });

    it('ignores a failed subscription fetch', async () => {
        const first = getSubscribedCalendar('first');
        const api = jest.fn(({ url }: { url: string }) =>
            url.includes('/second/')
                ? Promise.reject(new Error('not found'))
                : Promise.resolve({ CalendarSubscription: getSubscription('first') })
        );
        const { result, setCalendars } = setup(api, [first]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        setCalendars([first, getSubscribedCalendar('second')]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.subscribedCalendars.map(({ ID }) => ID)).toEqual(['first', 'second']);
        expect(withParameters(result.current.subscribedCalendars)).toEqual(['first']);
    });

    it('refreshes the subscriptions once when opened', async () => {
        const first = getSubscribedCalendar('first');
        let LastUpdateTime = 1;
        const api = jest.fn(() =>
            Promise.resolve({ CalendarSubscription: { ...getSubscription('first'), LastUpdateTime } })
        );
        const store = createStore(api, [first]);
        await store.dispatch(calendarSubscriptionThunk({ calendarID: 'first' }));
        LastUpdateTime = 2;

        const { result, callsFor } = setup(api, [first], store);
        // The cached value shows at once
        expect(result.current.loading).toBe(false);
        await waitFor(() =>
            expect(
                (result.current.subscribedCalendars[0] as SubscribedCalendar).SubscriptionParameters.LastUpdateTime
            ).toBe(2)
        );
        expect(callsFor('first')).toHaveLength(2);
    });

    it('keeps the last subscription when the refresh fails', async () => {
        const first = getSubscribedCalendar('first');
        const api = jest.fn(() => Promise.resolve({ CalendarSubscription: getSubscription('first') }));
        const store = createStore(api, [first]);
        await store.dispatch(calendarSubscriptionThunk({ calendarID: 'first' }));
        api.mockImplementation(() => Promise.reject(new Error('offline')));

        const { result } = setup(api, [first], store);
        await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
        await act(async () => {});

        expect(result.current.loading).toBe(false);
        expect(result.current.subscribedCalendars).toEqual([
            { ...first, SubscriptionParameters: getSubscription('first') },
        ]);
    });

    it('stops following the calendars once unmounted', async () => {
        const first = getSubscribedCalendar('first');
        const api = jest.fn(({ url }: { url: string }) =>
            Promise.resolve({ CalendarSubscription: getSubscription(url.split('/')[2]) })
        );
        const { result, store, unmount, callsFor } = setup(api, [first]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        unmount();
        store.dispatch(
            calendarsActions.updateCalendars([first, getSubscribedCalendar('second')] as CalendarWithOwnMembers[])
        );
        await act(async () => {});

        expect(callsFor('second')).toHaveLength(0);
    });

    it('applies subscription updates from the calendar event loop', async () => {
        const first = getSubscribedCalendar('first');
        const api = jest.fn(() => Promise.resolve({ CalendarSubscription: getSubscription('first') }));
        const { result, store } = setup(api, [first]);
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => {
            store.dispatch(
                calendarServerEvent({
                    CalendarSubscriptions: [
                        {
                            ID: 'first',
                            Action: EVENT_ACTIONS.UPDATE,
                            CalendarSubscription: { ...getSubscription('first'), LastUpdateTime: 42 },
                        },
                    ],
                    More: 0,
                    CalendarModelEventID: '',
                })
            );
        });

        expect(
            (result.current.subscribedCalendars[0] as SubscribedCalendar).SubscriptionParameters.LastUpdateTime
        ).toBe(42);
    });
});
