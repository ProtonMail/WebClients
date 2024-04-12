import { PayloadAction, UnknownAction, createSlice, miniSerializeError, original } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';

import type { ProtonThunkArguments } from '@proton/redux-shared-store';
import { createPromiseCache } from '@proton/redux-utilities';
import { queryDomains } from '@proton/shared/lib/api/domains';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Domain, User } from '@proton/shared/lib/interfaces';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { serverEvent } from '../eventLoop';
import type { ModelState } from '../interface';
import { UserState, userThunk } from '../user';

const name = 'domains' as const;

enum ValueType {
    dummy,
    complete,
}

interface State extends UserState {
    [name]: ModelState<Domain[]> & { meta?: { type: ValueType } };
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectDomains = (state: State) => state.domains;

const canFetch = (user: User) => {
    return isPaid(user);
};
const freeDomains: Domain[] = [];

const initialState: SliceState = {
    value: undefined,
    error: undefined,
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
            state.meta = { type: action.payload.type };
        },
        rejected: (state, action) => {
            state.error = action.payload;
            state.value = undefined;
            state.meta = { type: ValueType.complete };
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
                state.meta = { type: ValueType.complete };
            } else {
                if (!isFreeDomains && action.payload.User && !canFetch(action.payload.User)) {
                    // Do not get any domain update when user becomes unsubscribed.
                    state.value = freeDomains;
                    state.error = undefined;
                    state.meta = { type: ValueType.dummy };
                }

                if (isFreeDomains && action.payload.User && canFetch(action.payload.User)) {
                    state.value = undefined;
                    state.error = undefined;
                    state.meta = { type: ValueType.complete };
                }
            }
        });
    },
});

const promiseCache = createPromiseCache<Model>();

const modelThunk = (options?: {
    forceFetch?: boolean;
}): ThunkAction<Promise<Model>, State, ProtonThunkArguments, UnknownAction> => {
    return (dispatch, getState, extraArgument) => {
        const select = () => {
            const oldValue = selectDomains(getState());
            if (oldValue?.value !== undefined && !options?.forceFetch) {
                return Promise.resolve(oldValue.value);
            }
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
        return promiseCache(select, cb);
    };
};

export const domainsReducer = { [name]: slice.reducer };
export const domainsThunk = modelThunk;
