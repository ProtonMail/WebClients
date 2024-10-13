import { type PayloadAction, type UnknownAction, createSlice, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { AddressKeysState, AddressesState, ModelState } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type CacheType,
    cacheHelper,
    createPromiseMapStore,
    getFetchedAt,
    getFetchedEphemeral,
} from '@proton/redux-utilities';
import { getFullCalendar } from '@proton/shared/lib/api/calendars';
import {
    getIsCalendarMemberEventManagerCreate,
    getIsCalendarMemberEventManagerDelete,
    getIsCalendarMemberEventManagerUpdate,
} from '@proton/shared/lib/eventManager/calendar/helpers';
import type { CalendarBootstrap } from '@proton/shared/lib/interfaces/calendar';
import type { CalendarMemberEventManager } from '@proton/shared/lib/interfaces/calendar/EventManager';

import { calendarServerEvent } from '../calendarServerEvent';

const name = 'calendarsBootstrap' as const;

export interface CalendarsBootstrapState extends AddressesState, AddressKeysState {
    [name]: { [id: string]: ModelState<CalendarBootstrap> | undefined };
}

type SliceState = CalendarsBootstrapState[typeof name];
type Model = SliceState;

export const selectCalendarsBootstrap = (state: CalendarsBootstrapState) => state[name];

const initialState: Model = {};

export const findCalendarBootstrapID = (
    calendarBootstrapCache: CalendarsBootstrapState['calendarsBootstrap'],
    cb: (value: CalendarBootstrap) => boolean
) => {
    for (const [calendarID, record] of Object.entries(calendarBootstrapCache)) {
        // The old bootstrapped result
        if (record?.value && cb(record.value)) {
            return calendarID;
        }
    }
};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state, action: PayloadAction<{ id: string }>) => {
            const oldValue = state[action.payload.id];
            if (oldValue && oldValue.error) {
                oldValue.error = undefined;
            }
        },
        fulfilled: (state, action: PayloadAction<{ id: string; value: CalendarBootstrap }>) => {
            state[action.payload.id] = {
                value: action.payload.value,
                error: undefined,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: getFetchedEphemeral() },
            };
        },
        rejected: (state, action: PayloadAction<{ id: string; value: any }>) => {
            state[action.payload.id] = {
                value: undefined,
                error: action.payload.value,
                meta: { fetchedAt: getFetchedAt(), fetchedEphemeral: undefined },
            };
        },
        remove: (state, action: PayloadAction<{ id: string }>) => {
            state[action.payload.id] = undefined;
        },
        memberEvent: (state, action: PayloadAction<{ event: CalendarMemberEventManager }>) => {
            const event = action.payload.event;
            if (getIsCalendarMemberEventManagerDelete(event)) {
                const { ID: memberID } = event;
                const calendarID = findCalendarBootstrapID(state, ({ Members }) => {
                    return Boolean(Array.isArray(Members) && Members.find(({ ID }: { ID: string }) => ID === memberID));
                });
                if (!calendarID) {
                    return;
                }
                const oldRecord = state[calendarID];
                if (!oldRecord?.value) {
                    return;
                }
                const oldMembers = oldRecord.value.Members;
                const memberIndex = oldMembers.findIndex(({ ID }) => memberID === ID);
                if (memberIndex !== -1) {
                    return;
                }
                oldMembers.splice(memberIndex, 1);
            } else {
                const { ID, Member } = event;
                const oldRecord = state[Member.CalendarID];
                if (!oldRecord?.value) {
                    return;
                }
                const oldMembers = oldRecord.value.Members;
                const memberIndex = oldMembers.findIndex(({ ID: memberID }) => memberID === ID);
                if (getIsCalendarMemberEventManagerCreate(event)) {
                    if (memberIndex !== -1) {
                        return;
                    }
                    oldMembers.push(Member);
                } else if (getIsCalendarMemberEventManagerUpdate(event)) {
                    if (memberIndex === -1) {
                        return;
                    }
                    oldMembers.splice(memberIndex, 1, event.Member);
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(calendarServerEvent, (state, action) => {
            if (action.payload.CalendarSettings?.length) {
                for (const { CalendarSettings: newValue } of action.payload.CalendarSettings) {
                    const calendar = state[newValue.CalendarID]?.value;
                    if (!calendar) {
                        return;
                    }
                    calendar.CalendarSettings = newValue;
                }
            }
        });
    },
});

const promiseStore = createPromiseMapStore<CalendarBootstrap>();

export const calendarBootstrapThunk = ({
    calendarID,
    cache,
}: {
    calendarID: string;
    cache?: CacheType;
}): ThunkAction<Promise<CalendarBootstrap>, CalendarsBootstrapState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return selectCalendarsBootstrap(getState())?.[calendarID || ''];
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending({ id: calendarID }));
                const result = await extraArgument.api<CalendarBootstrap>({
                    ...getFullCalendar(calendarID),
                    silence: true,
                });
                dispatch(slice.actions.fulfilled({ id: calendarID, value: result }));
                return result;
            } catch (error) {
                dispatch(slice.actions.rejected({ id: calendarID, value: miniSerializeError(error) }));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, key: calendarID, select, cb, cache });
    };
};

export const calendarsBootstrapReducer = { [name]: slice.reducer };
export const calendarsBootstrapActions = slice.actions;
