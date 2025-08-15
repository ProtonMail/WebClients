import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import { getContact } from '@proton/mail/store/contacts/getContact';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryContacts } from '@proton/shared/lib/api/contacts';
import type { ContactEventV6Response } from '@proton/shared/lib/api/events';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { CONTACTS_LIMIT, CONTACTS_REQUESTS_PER_SECOND } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import type { UpdateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import { updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
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

export interface ContactsState {
    [name]: ModelState<Contact[]>;
}

type SliceState = ContactsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectContacts = (state: ContactsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, ContactsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getContactsModel(extraArgument.api);
    },
    previous: previousSelector(selectContacts),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<Contact>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
    },
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

const contactsActions = slice.actions;
export const contactsReducer = { [name]: slice.reducer };
export const contactsThunk = modelThunk.thunk;

export const contactsEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: ContactEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, ContactsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.Contacts,
            get: (ID) => getContact(api, ID),
            refetch: () => dispatch(contactsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(contactsActions.eventLoopV6(result)),
        });
    };
};
