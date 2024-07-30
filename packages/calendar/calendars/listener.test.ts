import { combineReducers } from '@reduxjs/toolkit';

import { addressesReducer } from '@proton/account/addresses';
import { serverEvent } from '@proton/account/eventLoop';
import { getModelState } from '@proton/account/test';
import { userReducer } from '@proton/account/user';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CALENDAR_DISPLAY, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { Calendar, CalendarMember, CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

import { createCalendarModelEventManager } from '../calendarModelEventManager';
import type { CalendarThunkArguments } from '../interface';
import { calendarsReducer } from './index';
import { startCalendarEventListener } from './listener';

jest.mock('@proton/crypto', () => {
    return {
        CryptoProxy: {},
    };
});
jest.mock('@proton/srp', () => {});

const reducer = combineReducers({
    ...userReducer,
    ...addressesReducer,
    ...calendarsReducer,
});
const setup = (preloadedState?: Partial<ReturnType<typeof reducer>>) => {
    const actions: any[] = [];

    const calendarModelEventManager = createCalendarModelEventManager({
        api: (async () => {}) as any,
    });
    const extraThunkArguments = { calendarModelEventManager } as CalendarThunkArguments;

    const { store, startListening } = getTestStore({
        preloadedState: {
            user: getModelState({ Keys: [{ PrivateKey: '1' }] } as UserModel),
            calendars: getModelState([]),
            addresses: getModelState([]),
            ...preloadedState,
        },
        reducer,
        extraThunkArguments,
    });

    startCalendarEventListener(startListening);

    return {
        store,
        actions,
    };
};

describe('calendar listener', () => {
    it('should react to calendar object server events', async () => {
        const { store } = setup();

        const getCalendars = () => store.getState().calendars.value;

        const newCalendar: CalendarWithOwnMembers = {
            ID: '1',
            Type: CALENDAR_TYPE.PERSONAL,
            Owner: {
                Email: 'foo@bar.com',
            },
            Members: [],
        };

        expect(getCalendars()).toEqual([]);
        store.dispatch(serverEvent({ Calendars: [] }));
        expect(getCalendars()).toEqual([]);
        store.dispatch(
            serverEvent({
                Calendars: [{ ID: newCalendar.ID, Action: EVENT_ACTIONS.CREATE, Calendar: newCalendar }],
            })
        );
        expect(getCalendars()).toEqual([newCalendar]);

        const updatedCalendar: Calendar = {
            ID: '1',
            Type: CALENDAR_TYPE.PERSONAL,
        };
        store.dispatch(
            serverEvent({
                Calendars: [{ ID: newCalendar.ID, Action: EVENT_ACTIONS.UPDATE, Calendar: updatedCalendar }],
            })
        );
        const newCalendarMember: CalendarMember = {
            ID: 'a',
            CalendarID: '1',
            AddressID: '123',
            Flags: 1,
            Name: 'foo',
            Description: 'asd',
            Email: 'foo@bar.com',
            Permissions: 1,
            Color: '',
            Display: CALENDAR_DISPLAY.VISIBLE,
            Priority: 1,
        };
        expect(getCalendars()).toEqual([newCalendar]);
        store.dispatch(
            serverEvent({
                CalendarMembers: [
                    { ID: newCalendarMember.ID, Action: EVENT_ACTIONS.CREATE, Member: newCalendarMember },
                ],
            })
        );

        const unknownCalendarMembers = {
            ...newCalendarMember,
            ID: 'unknown-member',
            CalendarID: 'unknown-calendar',
        };
        expect(getCalendars()).toEqual([{ ...newCalendar, Members: [newCalendarMember] }]);
        const oldCalendar = getCalendars();
        // Should not do anything and keep referential equality
        store.dispatch(
            serverEvent({
                CalendarMembers: [
                    {
                        ID: unknownCalendarMembers.ID,
                        Action: EVENT_ACTIONS.CREATE,
                        Member: unknownCalendarMembers,
                    },
                ],
            })
        );
        expect(getCalendars()).toBe(oldCalendar);
    });
});
