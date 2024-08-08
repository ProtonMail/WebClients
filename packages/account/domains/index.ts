import type { PayloadAction, UnknownAction} from '@reduxjs/toolkit';
import { createSlice, miniSerializeError, original } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type {
    CacheType} from '@proton/redux-utilities';
import {
    cacheHelper,
    createPromiseStore,
    getFetchedAt,
    getFetchedEphemeral,
    previousSelector,
} from '@proton/redux-utilities';
import { queryDomains } from '@proton/shared/lib/api/domains';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Domain, User } from '@proton/shared/lib/interfaces';
import { isAdmin } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import type { UserState} from '../user';
import { userThunk } from '../user';

const name = 'domains' as const;

enum ValueType {
    dummy,
    complete,
}

export interface DomainsState extends UserState {
    [name]: ModelState<Domain[]> & { meta: { type: ValueType } };
}

type SliceState = DomainsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectDomains = (state: DomainsState) => state.domains;

const canFetch = (user: User) => {
    return isAdmin(user);
};
const freeDomains: Domain[] = [];

const initialState: SliceState = {
    value: undefined,
    error: undefined,
    meta: {
        fetchedEphemeral: undefined,
        fetchedAt: 0,
        type: ValueType.dummy,
    },
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        pending: (state) => {
            state.error = undefined;
        },
        fulfilled: (state, action: PayloadAction<{ value: Model; type: ValueType }>) => {
            state.value = action.payload.value;
            state.error = undefined;
            state.meta.type = action.payload.type;
            state.meta.fetchedAt = getFetchedAt();
            state.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.meta.fetchedAt = getFetchedAt();
        },
    },
    extraReducers: (builder) => {
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }
            const isFreeDomains = original(state)?.meta?.type === ValueType.dummy;
            if (action.payload.Domains && !isFreeDomains) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Domains,
                    itemKey: 'Domain',
                });
                state.error = undefined;
                state.meta.type = ValueType.complete;
            } else {
                if (!isFreeDomains && action.payload.User && !canFetch(action.payload.User)) {
                    // Do not get any domain update when user becomes unsubscribed.
                    state.value = freeDomains;
                    state.error = undefined;
                    state.meta.type = ValueType.dummy;
                }

                if (isFreeDomains && action.payload.User && canFetch(action.payload.User)) {
                    state.value = undefined;
                    state.error = undefined;
                    state.meta.type = ValueType.complete;
                }
            }
        });
    },
});

const promiseStore = createPromiseStore<Model>();

const previous = previousSelector(selectDomains);

const modelThunk = (options?: {
    cache?: CacheType;
}): ThunkAction<Promise<Model>, DomainsState, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            return previous({ dispatch, getState, extraArgument, options });
        };
        const getPayload = async () => {
            const user = await dispatch(userThunk());
            if (!canFetch(user)) {
                return {
                    value: freeDomains,
                    type: ValueType.dummy,
                };
            }
            const pages = await queryPages((page, pageSize) => {
                return extraArgument.api<{ Domains: Domain[]; Total: number }>(
                    queryDomains({
                        Page: page,
                        PageSize: pageSize,
                    })
                );
            });
            const value = pages.flatMap(({ Domains }) => Domains);
            return {
                value,
                type: ValueType.complete,
            };
        };
        const cb = async () => {
            try {
                dispatch(slice.actions.pending());
                const payload = await getPayload();
                dispatch(slice.actions.fulfilled(payload));
                return payload.value;
            } catch (error) {
                dispatch(slice.actions.rejected(miniSerializeError(error)));
                throw error;
            }
        };
        return cacheHelper({ store: promiseStore, select, cb, cache: options?.cache });
    };
};

export const domainsReducer = { [name]: slice.reducer };
export const domainsThunk = modelThunk;
