import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { addressesReducer } from '@proton/account/addresses';
import { getModelState } from '@proton/account/testing/getModelState';
import type { SharedStartListening } from '@proton/redux-shared-store-types/interface';
import { ActionEventV6, type CalendarEventV6Response } from '@proton/shared/lib/api/events';
import { APPS } from '@proton/shared/lib/constants';
import type { CalendarUserSettings, CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar/Calendar';
import type { CalendarMember } from '@proton/shared/lib/interfaces/calendar/CalendarMember';

import { calendarSettingsReducer } from '../calendarUserSettings';
import { calendarsReducer } from '../calendars';
import { calendarEventLoopV6 } from './index';
import type { CalendarEventLoopV6RequiredState } from './interface';
import { calendarEventLoopV6Listener } from './listeners';

const member = { ID: 'member-id', CalendarID: 'calendar-id', Name: 'Before' } as CalendarMember;
const calendar = { ID: 'calendar-id', Members: [member] } as CalendarWithOwnMembers;
const otherCalendar = { ID: 'other-calendar-id', Members: [] as CalendarMember[] } as CalendarWithOwnMembers;

const setup = ({ calendars = [calendar, otherCalendar] }: { calendars?: CalendarWithOwnMembers[] } = {}) => {
    const api = jest.fn().mockImplementation(({ url }: { url: string }) => {
        if (url === 'calendar/v1/calendar-id') {
            return Promise.resolve({ Calendar: { ID: 'calendar-id' } });
        }
        if (url === 'calendar/v1/calendar-id/members') {
            return Promise.resolve({ Members: [{ ...member, Name: 'After' }] });
        }
        if (url === 'calendar/v1') {
            return Promise.resolve({ Calendars: calendars });
        }
        if (url === 'settings/calendar') {
            return Promise.resolve({ CalendarUserSettings: { WeekLength: 5 } });
        }
        return Promise.reject(new Error(`unexpected url ${url}`));
    });

    const extraArgument = { api, config: { APP_NAME: APPS.PROTONACCOUNT } };
    const listenerMiddleware = createListenerMiddleware({ extra: extraArgument });
    const store = configureStore({
        reducer: combineReducers({ ...addressesReducer, ...calendarsReducer, ...calendarSettingsReducer }),
        preloadedState: {
            addresses: getModelState([]),
            calendars: getModelState(calendars),
            calendarUserSettings: getModelState({ WeekLength: 7 } as CalendarUserSettings),
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({ thunk: { extraArgument } }).prepend(listenerMiddleware.middleware),
    });
    calendarEventLoopV6Listener(
        listenerMiddleware.startListening as unknown as SharedStartListening<CalendarEventLoopV6RequiredState>
    );

    const fire = async (event: Partial<CalendarEventV6Response>) => {
        const promises: Promise<any>[] = [];
        store.dispatch(calendarEventLoopV6({ event: event as CalendarEventV6Response, promises }));
        await Promise.all(promises);
    };
    const urlsCalled = () => api.mock.calls.map(([request]: [{ url: string }]) => request.url);

    return { store, fire, urlsCalled };
};

describe('calendar event loop v6', () => {
    it('refetches the calendar holding a changed member', async () => {
        const { store, fire, urlsCalled } = setup();

        await fire({ CalendarMembers: [{ ID: 'member-id', Action: ActionEventV6.Update }] });

        expect(urlsCalled().sort()).toEqual(['calendar/v1/calendar-id', 'calendar/v1/calendar-id/members']);
        expect(store.getState().calendars.value).toEqual([
            { ID: 'calendar-id', Members: [{ ...member, Name: 'After' }] },
            otherCalendar,
        ]);
    });

    it('does not fetch a calendar deleted in the same event', async () => {
        const { store, fire, urlsCalled } = setup();

        await fire({
            Calendars: [{ ID: 'calendar-id', Action: ActionEventV6.Delete }],
            CalendarMembers: [{ ID: 'member-id', Action: ActionEventV6.Update }],
        });

        expect(urlsCalled()).toEqual([]);
        expect(store.getState().calendars.value).toEqual([otherCalendar]);
    });

    it('counts a calendar once toward the refetch limit for several of its members', async () => {
        // More than 6 changes would refetch the whole list
        const memberIDs = ['1', '2', '3', '4', '5', '6', '7'].map((index) => `member-${index}`);
        const { fire, urlsCalled } = setup({
            calendars: [{ ...calendar, Members: memberIDs.map((ID) => ({ ...member, ID })) }, otherCalendar],
        });

        await fire({ CalendarMembers: memberIDs.map((ID) => ({ ID, Action: ActionEventV6.Update })) });

        expect(urlsCalled().sort()).toEqual(['calendar/v1/calendar-id', 'calendar/v1/calendar-id/members']);
    });

    it('ignores members it does not hold', async () => {
        const { fire, urlsCalled } = setup();

        await fire({ CalendarMembers: [{ ID: 'unknown-member-id', Action: ActionEventV6.Create }] });

        expect(urlsCalled()).toEqual([]);
    });

    it('refetches the calendar user settings', async () => {
        const { store, fire, urlsCalled } = setup();

        await fire({ CalendarUserSettings: [{ ID: 'settings-id', Action: ActionEventV6.Update }] });

        expect(urlsCalled()).toEqual(['settings/calendar']);
        expect(store.getState().calendarUserSettings.value).toEqual({ WeekLength: 5 });
    });
});
