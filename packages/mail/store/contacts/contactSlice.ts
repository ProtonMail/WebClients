import { type PayloadAction, type UnknownAction, createSlice, miniSerializeError } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { type ModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type CacheType,
    cacheHelper,
    createPromiseMapStore,
    getFetchedAt,
    getFetchedEphemeral,
} from '@proton/redux-utilities';
import { getContact } from '@proton/shared/lib/api/contacts';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { Contact } from '@proton/shared/lib/interfaces/contacts';

const name = 'contact';

export interface ContactState {
    [name]: { [id: string]: ModelState<Contact> };
}

type SliceState = ContactState[typeof name];
type Model = SliceState;

export const selectContact = (state: ContactState) => state[name];

const initialState: Model = {};
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
        fulfilled: (state, action: PayloadAction<{ id: string; value: Contact }>) => {
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
    },
    extraReducers: (builder) => {
        builder.addCase(serverEvent, (state, action) => {
            if (action.payload.Contacts) {
                for (const update of action.payload.Contacts) {
                    if (update.Action === EVENT_ACTIONS.DELETE) {
                        delete state[update.ID];
                    }
                    if (update.Action === EVENT_ACTIONS.UPDATE) {
                        if (state[update.ID]) {
                            state[update.ID].value = update.Contact as Contact;
                        }
                    }
                }
            }
            if (hasBit(action.payload.Refresh, EVENT_ERRORS.CONTACTS)) {
                return {};
            }
        });
    },
});

const promiseStore = createPromiseMapStore<Contact>();

export const contactThunk = ({
    contactID,
    cache,
}: {
    contactID: string;
    cache?: CacheType;
}): ThunkAction<Promise<Contact>, ContactState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return selectContact(getState())?.[contactID || ''];
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending({ id: contactID }));
                const contact = await extraArgument
                    .api<{
                        Contact: Contact;
                    }>(getContact(contactID))
                    .then(({ Contact }) => Contact);
                dispatch(slice.actions.fulfilled({ id: contactID, value: contact }));
                return contact;
            } catch (error) {
                dispatch(slice.actions.rejected({ id: contactID, value: miniSerializeError(error) }));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, key: contactID, select, cb, cache });
    };
};

export const contactReducer = { [name]: slice.reducer };
