import { createSlice, original } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryDomains } from '@proton/shared/lib/api/domains';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Domain, User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'domains' as const;

interface State extends UserState {
    [name]: ModelState<Domain[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectDomains = (state: State) => state.domains;

const canFetch = (user: User) => {
    return isPaid(user);
};
const freeDomains: Domain[] = [];

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const user = await dispatch(userThunk());
        if (!canFetch(user)) {
            return freeDomains;
        }
        return queryPages((page, pageSize) => {
            return extraArgument.api(
                queryDomains({
                    Page: page,
                    PageSize: pageSize,
                })
            );
        }).then((pages) => {
            return pages.flatMap(({ Domains }) => Domains);
        });
    },
    previous: previousSelector(selectDomains),
});

const initialState: SliceState = {
    value: undefined,
    error: undefined,
};
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.Domains) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Domains,
                    itemKey: 'Domain',
                });
            } else {
                const isFreeDomains = original(state)?.value === freeDomains;

                if (!isFreeDomains && action.payload.User && !canFetch(action.payload.User)) {
                    // Do not get any domain update when user becomes unsubscribed.
                    state.value = freeDomains;
                }

                if (isFreeDomains && action.payload.User && canFetch(action.payload.User)) {
                    delete state.value;
                    delete state.error;
                }
            }
        });
    },
});

export const domainsReducer = { [name]: slice.reducer };
export const domainsThunk = modelThunk.thunk;
