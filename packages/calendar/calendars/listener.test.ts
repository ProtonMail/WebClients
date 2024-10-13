import { combineReducers } from '@reduxjs/toolkit';

import { addressKeysReducer } from '@proton/account/addressKeys';
import { addressesReducer } from '@proton/account/addresses';
import { serverEvent } from '@proton/account/eventLoop';
import { getModelState } from '@proton/account/test';
import { userReducer } from '@proton/account/user';
import { userKeysReducer } from '@proton/account/userKeys';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CALENDAR_SHARE_BUSY_TIME_SLOTS, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type {
    Calendar,
    CalendarBootstrap,
    CalendarKey,
    CalendarMember,
    CalendarSettings,
    CalendarWithOwnMembers,
} from '@proton/shared/lib/interfaces/calendar';
import { CalendarKeyFlags } from '@proton/shared/lib/interfaces/calendar';

import { calendarsBootstrapReducer } from '../calendarBootstrap';
import { createCalendarModelEventManager } from '../calendarModelEventManager';
import { calendarServerEvent } from '../calendarServerEvent';
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
    ...userKeysReducer,
    ...addressesReducer,
    ...addressKeysReducer,
    ...calendarsReducer,
    ...calendarsBootstrapReducer,
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
            addressKeys: {},
            calendarsBootstrap: {},
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

const getMockMember = (data: Partial<CalendarMember> & { CalendarID: string }): CalendarMember => {
    return {
        ID: 'memberId',
        Name: '',
        Description: '',
        Priority: 1,
        AddressID: 'addressId',
        Permissions: 127,
        Email: 'test@pm.gg',
        Flags: 1,
        Color: '#f00',
        Display: 1,
        ...data,
    };
};

const getMockCalendarSettings = (data: Partial<CalendarSettings> & { CalendarID: string }): CalendarSettings => {
    return {
        ID: 'id3',
        DefaultEventDuration: 30,
        MakesUserBusy: CALENDAR_SHARE_BUSY_TIME_SLOTS.YES,
        DefaultPartDayNotifications: [
            {
                Type: 1,
                Trigger: '-PT17M',
            },
            {
                Type: 0,
                Trigger: '-PT17M',
            },
        ],
        DefaultFullDayNotifications: [
            {
                Type: 1,
                Trigger: '-PT17H',
            },
            {
                Type: 0,
                Trigger: '-PT17H',
            },
        ],
        ...data,
    };
};

const getMockCalendarKey = (data: Partial<CalendarKey> & { CalendarID: string }): CalendarKey => {
    return {
        ID: 'key1id',
        PrivateKey: 'privateKey',
        PassphraseID: 'passphraseID',
        Flags: CalendarKeyFlags.ACTIVE,
        ...data,
    };
};

const getMockBootstrap = ({ CalendarID }: { CalendarID: string }): CalendarBootstrap => {
    return {
        Keys: [getMockCalendarKey({ CalendarID })],
        Passphrase: {
            Flags: 1,
            ID: 'passphraseId',
            MemberPassphrases: [
                {
                    MemberID: 'memberId',
                    Passphrase: 'memberPassphrase',
                    Signature: 'memberSignature',
                },
            ],
            Invitations: [],
        },
        Members: [getMockMember({ CalendarID })],
        CalendarSettings: getMockCalendarSettings({ CalendarID }),
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
        const newCalendarMember = getMockMember({
            CalendarID: '1',
        });
        expect(getCalendars()).toEqual([newCalendar]);
        store.dispatch(
            serverEvent({
                CalendarMembers: [
                    { ID: newCalendarMember.ID, Action: EVENT_ACTIONS.CREATE, Member: newCalendarMember },
                ],
            })
        );
        expect(getCalendars()).toEqual([{ ...newCalendar, Members: [newCalendarMember] }]);

        const unknownCalendarMembers = {
            ...newCalendarMember,
            ID: 'unknown-member',
            CalendarID: 'unknown-calendar',
        };
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

    it('should remove calendar bootstrap when calendar is deleted', async () => {
        const initialCalendar = getModelState(getMockBootstrap({ CalendarID: '123' }));
        const { store } = setup({
            calendarsBootstrap: {
                '123': initialCalendar,
            },
        });
        const getCalendarBootstrap = (calendarID: string) => store.getState().calendarsBootstrap[calendarID]?.value;

        expect(getCalendarBootstrap('123')).toEqual(initialCalendar.value);
        store.dispatch(
            serverEvent({
                Calendars: [{ ID: '123', Action: EVENT_ACTIONS.DELETE }],
            })
        );
        expect(getCalendarBootstrap('123')).toEqual(undefined);
    });

    it('should update calendar bootstrap settings', async () => {
        const initialCalendar = getModelState(getMockBootstrap({ CalendarID: '123' }));
        const { store } = setup({
            calendarsBootstrap: {
                '123': initialCalendar,
            },
        });
        const getCalendarBootstrap = (calendarID: string) => store.getState().calendarsBootstrap[calendarID]?.value;

        expect(getCalendarBootstrap('123')).toEqual(initialCalendar.value);
        store.dispatch(
            calendarServerEvent({
                CalendarSettings: [
                    {
                        CalendarSettings: getMockCalendarSettings({
                            CalendarID: '123',
                            DefaultEventDuration: 1,
                        }),
                    },
                ],
            })
        );
        expect(getCalendarBootstrap('123')).toEqual({
            ...initialCalendar.value,
            CalendarSettings: { ...initialCalendar.value?.CalendarSettings, DefaultEventDuration: 1 },
        });
    });

    it('should remove calendar bootstrap on keys change', async () => {
        const initialCalendar = getModelState(getMockBootstrap({ CalendarID: '123' }));
        const initialCalendar2 = getModelState(getMockBootstrap({ CalendarID: '124' }));
        const { store } = setup({
            calendarsBootstrap: {
                '123': initialCalendar,
                '124': initialCalendar2,
            },
        });
        const getCalendarBootstrap = (calendarID: string) => store.getState().calendarsBootstrap[calendarID]?.value;

        expect(getCalendarBootstrap('123')).toEqual(initialCalendar.value);
        expect(getCalendarBootstrap('124')).toEqual(initialCalendar2.value);
        store.dispatch(
            calendarServerEvent({
                CalendarKeys: [
                    {
                        ID: '1',
                        Key: getMockCalendarKey({ CalendarID: '123' }),
                    },
                    {
                        ID: '1',
                        Key: getMockCalendarKey({ CalendarID: 'unknown' }),
                    },
                ],
            })
        );
        expect(getCalendarBootstrap('123')).toEqual(undefined);
        expect(getCalendarBootstrap('124')).toEqual(initialCalendar2.value);

        const calendarKeyWithoutCalendarID = getMockCalendarKey({ CalendarID: '', ID: 'key1id' });
        store.dispatch(
            calendarServerEvent({
                CalendarKeys: [
                    {
                        ID: 'key1id',
                        Key: calendarKeyWithoutCalendarID,
                    },
                ],
            })
        );
        expect(getCalendarBootstrap('124')).toEqual(undefined);
    });

    it('should react to calendar bootstrap object server events', async () => {
        const initialCalendar = getModelState(getMockBootstrap({ CalendarID: '123' }));
        const { store } = setup({
            calendarsBootstrap: {
                '123': initialCalendar,
            },
        });

        const getCalendarBootstrap = (calendarID: string) => store.getState().calendarsBootstrap[calendarID]?.value;

        expect(getCalendarBootstrap('123')).toEqual(initialCalendar.value);
        store.dispatch(serverEvent({ Calendars: [] }));
        expect(getCalendarBootstrap('123')).toEqual(initialCalendar.value);

        const newCalendarMember = getMockMember({ CalendarID: '123', ID: 'new-member' });
        store.dispatch(
            serverEvent({
                CalendarMembers: [
                    { ID: newCalendarMember.ID, Action: EVENT_ACTIONS.CREATE, Member: newCalendarMember },
                ],
            })
        );

        const newCalendarMembers = [...initialCalendar.value?.Members!, newCalendarMember];
        expect(getCalendarBootstrap('123')).toEqual({ ...initialCalendar.value, Members: newCalendarMembers });

        const updatedCalendarMember = getMockMember({ CalendarID: '123', ID: 'new-member', Color: 'red' });
        store.dispatch(
            serverEvent({
                CalendarMembers: [
                    { ID: updatedCalendarMember.ID, Action: EVENT_ACTIONS.UPDATE, Member: updatedCalendarMember },
                ],
            })
        );

        const updatedCalendarMembers = [...initialCalendar.value?.Members!, updatedCalendarMember];
        expect(getCalendarBootstrap('123')).toEqual({ ...initialCalendar.value, Members: updatedCalendarMembers });

        const unknownCalendarMembers = {
            ...newCalendarMember,
            ID: 'unknown-member',
            CalendarID: 'unknown-calendar',
        };
        const oldCalendar = getCalendarBootstrap('123');
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
        expect(getCalendarBootstrap('123')).toBe(oldCalendar);
    });
});
