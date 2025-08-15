import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import { getContactEmail } from '@proton/mail/store/contactEmails/getContactEmail';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryContactEmails } from '@proton/shared/lib/api/contacts';
import type { ContactEventV6Response } from '@proton/shared/lib/api/events';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { CONTACTS_REQUESTS_PER_SECOND, CONTACT_EMAILS_LIMIT } from '@proton/shared/lib/constants';
import { EVENT_ERRORS } from '@proton/shared/lib/errors';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import updateCollection, { sortCollection } from '@proton/shared/lib/helpers/updateCollection';
import type { Api } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';

const name = 'contactEmails' as const;

const getContactEmailsModel = (api: Api) => {
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

export interface ContactEmailsState {
    [name]: ModelState<ContactEmail[]>;
}

type SliceState = ContactEmailsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectContactEmails = (state: ContactEmailsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, ContactEmailsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getContactEmailsModel(extraArgument.api);
    },
    previous: previousSelector(selectContactEmails),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<ContactEmail>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
    },
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
const contactEmailsActions = slice.actions;
export const contactEmailsThunk = modelThunk.thunk;

export const contactEmailsEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: ContactEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, ContactEmailsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.ContactEmails,
            get: (ID) => getContactEmail(api, ID),
            refetch: () => dispatch(contactEmailsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(contactEmailsActions.eventLoopV6(result)),
        });
    };
};
