import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { createDraft, finishDraft } from 'immer';

import { AddressesState, type ModelState, selectAddresses, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryCalendars } from '@proton/shared/lib/api/calendars';
import {
    findMemberIndices,
    getIsCalendarEventManagerCreate,
    getIsCalendarEventManagerDelete,
    getIsCalendarEventManagerUpdate,
    getIsCalendarMemberEventManagerCreate,
    getIsCalendarMemberEventManagerDelete,
    getIsCalendarMemberEventManagerUpdate,
} from '@proton/shared/lib/eventManager/calendar/helpers';
import type { CalendarWithOwnMembers } from '@proton/shared/lib/interfaces/calendar';

import { calendarEventModelManager } from '../calendarModelEventManager';

interface State extends AddressesState {
    calendars: ModelState<CalendarWithOwnMembers[]>;
}

const name = 'calendars' as const;
type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCalendars = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return extraArgument.api<{ Calendars: CalendarWithOwnMembers[] }>(queryCalendars()).then(({ Calendars }) => {
            return Calendars;
        });
    },
    previous: previousSelector(selectCalendars),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        updateCalendars: (state, action: PayloadAction<CalendarWithOwnMembers[]>) => {
            state.value = action.payload;
            state.error = undefined;
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
    },
});

// This calendar event listener needs to access the global state to get the addresses.
export const startCalendarEventListener = (startListening: SharedStartListening<State>) => {
    startListening({
        actionCreator: serverEvent,
        effect: async (action, listenerApi) => {
            if (!action.payload.Calendars && !action.payload.CalendarMembers) {
                return;
            }

            const state = listenerApi.getState();
            const currentCalendarsWithMembers = selectCalendars(state).value;
            if (!currentCalendarsWithMembers) {
                return;
            }

            const updateCalendars = action.payload.Calendars;
            const updateMembers = action.payload.CalendarMembers;
            const newCalendarsWithMembers = createDraft(currentCalendarsWithMembers);
            const oldCalendarsWithMembers = [...currentCalendarsWithMembers];
            let updated = false;

            if (updateCalendars?.length) {
                for (const event of updateCalendars) {
                    if (getIsCalendarEventManagerDelete(event)) {
                        const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === event.ID);
                        if (index !== -1) {
                            newCalendarsWithMembers.splice(index, 1);
                            updated = true;
                        }
                        calendarEventModelManager.reset([event.ID]);
                    } else if (getIsCalendarEventManagerCreate(event)) {
                        const { ID: calendarID, Calendar } = event;
                        const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === calendarID);
                        if (index !== -1) {
                            // The calendar already exists for a creation event. Ignore it.
                            continue;
                        }
                        newCalendarsWithMembers.push({ ...Calendar });
                        updated = true;
                    } else if (getIsCalendarEventManagerUpdate(event)) {
                        const { ID: calendarID, Calendar } = event;
                        const index = newCalendarsWithMembers.findIndex(({ ID }) => ID === calendarID);
                        if (index !== -1) {
                            // update only the calendar part. Members updated below if needed
                            const oldCalendarWithMembers = oldCalendarsWithMembers[index];
                            newCalendarsWithMembers.splice(index, 1, { ...oldCalendarWithMembers, ...Calendar });
                            updated = true;
                        }
                    }
                }
            }

            if (updateMembers?.length) {
                const ownAddressIDs = (selectAddresses(state)?.value || []).map(({ ID }) => ID);

                for (const event of updateMembers) {
                    if (getIsCalendarMemberEventManagerDelete(event)) {
                        const [calendarIndex, memberIndex] = findMemberIndices(event.ID, newCalendarsWithMembers);
                        if (calendarIndex !== -1 && memberIndex !== -1) {
                            const { CalendarID, AddressID } =
                                newCalendarsWithMembers[calendarIndex].Members[memberIndex]!;
                            if (ownAddressIDs.includes(AddressID)) {
                                // the user is the member removed -> remove the calendar
                                newCalendarsWithMembers.splice(calendarIndex, 1);
                                updated = true;
                                calendarEventModelManager.reset([CalendarID]);
                            } else {
                                // otherwise a member of one of an owned calendar got removed -> remove the member
                                newCalendarsWithMembers[calendarIndex].Members.splice(memberIndex, 1);
                                updated = true;
                            }
                        }
                    } else {
                        const [calendarIndex, memberIndex] = findMemberIndices(
                            event.ID,
                            newCalendarsWithMembers,
                            event.Member.CalendarID
                        );
                        // If the targeted calendar cannot be found, ignore this update. It will be dealt with when the calendar update happens.
                        if (calendarIndex === -1) {
                            continue;
                        }
                        if (getIsCalendarMemberEventManagerCreate(event)) {
                            if (memberIndex !== -1) {
                                continue;
                            }
                            newCalendarsWithMembers[calendarIndex].Members.push(event.Member);
                            updated = true;
                        } else if (getIsCalendarMemberEventManagerUpdate(event)) {
                            if (memberIndex === -1) {
                                continue;
                            }
                            newCalendarsWithMembers[calendarIndex].Members.splice(memberIndex, 1, event.Member);
                            updated = true;
                        }
                    }
                }
            }
            const result = finishDraft(newCalendarsWithMembers);
            if (updated) {
                listenerApi.dispatch(slice.actions.updateCalendars(result));
            }
        },
    });
};

export const calendarsReducer = { [name]: slice.reducer };
export const calendarsThunk = modelThunk.thunk;
