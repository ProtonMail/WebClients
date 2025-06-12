import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryContactEmails } from '@proton/shared/lib/api/contacts';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { CONTACTS_REQUESTS_PER_SECOND, CONTACT_EMAILS_LIMIT } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import updateCollection, { sortCollection } from '@proton/shared/lib/helpers/updateCollection';
import type { Api } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

const name = 'contactEmails' as const;

export const getContactEmailsModel = (api: Api) => {
    return queryPages(
        (page, pageSize) => {
            return api(
                queryContactEmails({
                    Page: page,
                    PageSize: pageSize,
                })
            );
        },
        {
            pageSize: CONTACT_EMAILS_LIMIT,
            pagesPerChunk: CONTACTS_REQUESTS_PER_SECOND,
            delayPerChunk: 1000,
        }
    ).then((pages) => {
        return sortCollection(
            'Order',
            pages.flatMap(({ ContactEmails }) => ContactEmails)
        );
    });
};

interface State {
    [name]: ModelState<ContactEmail[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectContactEmails = (state: State) => state[name];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getContactEmailsModel(extraArgument.api);
    },
    previous: previousSelector(selectContactEmails),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.ContactEmails) {
                state.value = sortCollection(
                    'Order',
                    updateCollection({
                        model: state.value,
                        events: action.payload.ContactEmails,
                        itemKey: 'ContactEmail',
                    })
                );
            }
            if (state.value && hasBit(action.payload.Refresh, EVENT_ERRORS.CONTACTS)) {
                delete state.value;
                delete state.error;
            }
        });
    },
});

export const contactEmailsReducer = { [name]: slice.reducer };
export const contactEmailsThunk = modelThunk.thunk;
