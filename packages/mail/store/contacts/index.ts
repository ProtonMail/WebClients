import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryContacts } from '@proton/shared/lib/api/contacts';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { CONTACTS_LIMIT, CONTACTS_REQUESTS_PER_SECOND } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import { type Api } from '@proton/shared/lib/interfaces';
import { type Contact } from '@proton/shared/lib/interfaces/contacts';

const name = 'contacts' as const;

const compareName = (a: Contact, b: Contact) => a.Name.localeCompare(b.Name);

export const getContactsModel = (api: Api) => {
    return queryPages(
        (Page, PageSize) =>
            api(
                queryContacts({
                    Page,
                    PageSize,
                })
            ),
        {
            pageSize: CONTACTS_LIMIT,
            pagesPerChunk: CONTACTS_REQUESTS_PER_SECOND,
        }
    ).then((pages) => {
        return pages.flatMap(({ Contacts }) => Contacts).sort(compareName);
    });
};

interface State {
    [name]: ModelState<Contact[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectContacts = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getContactsModel(extraArgument.api);
    },
    previous: previousSelector(selectContacts),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.Contacts) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Contacts,
                    itemKey: 'Contact',
                    // Event updates return the full item to use
                    merge: (_, b) => b as Contact,
                }).sort(compareName);
            }
            if (state.value && hasBit(action.payload.Refresh, EVENT_ERRORS.CONTACTS)) {
                delete state.value;
                delete state.error;
            }
        });
    },
});

export const contactsReducer = { [name]: slice.reducer };
export const contactsThunk = modelThunk.thunk;
