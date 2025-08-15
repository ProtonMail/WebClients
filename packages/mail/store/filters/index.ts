import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { Filter } from '@proton/components/containers/filters/interfaces';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { MailEventV6Response } from '@proton/shared/lib/api/events';
import { queryFilter, queryFilters } from '@proton/shared/lib/api/filters';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection, { sortCollection } from '@proton/shared/lib/helpers/updateCollection';
import type { Api } from '@proton/shared/lib/interfaces';
import { removeById } from '@proton/utils/removeById';
import { upsertById } from '@proton/utils/upsertById';

const name = 'filters' as const;

export interface MailFiltersState {
    [name]: ModelState<Filter[]>;
}

export type FiltersState = MailFiltersState[typeof name];
type Model = NonNullable<FiltersState['value']>;

const getFilter = async (api: Api, ID: string) => {
    const { Filter } = await api<{ Filter: Filter }>(queryFilter(ID));
    return Filter;
};

export const selectFilters = (state: MailFiltersState) => state[name];

const modelThunk = createAsyncModelThunk<Model, MailFiltersState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return extraArgument
            .api<{
                Filters: Filter[];
            }>(queryFilters())
            .then(({ Filters }) => sortCollection('Priority', [...Filters]));
    },
    previous: previousSelector(selectFilters),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<Filter>>) => {
            if (state.value) {
                state.value = sortCollection('Priority', updateCollectionV6(state.value, action.payload));
            }
        },
        deleteFilter: (state, action: PayloadAction<{ ID: string }>) => {
            if (!state.value) {
                return;
            }
            state.value = sortCollection('Priority', removeById(state.value, action.payload, 'ID'));
        },
        upsertFilter: (state, action: PayloadAction<Filter>) => {
            if (!state.value) {
                return;
            }
            state.value = sortCollection('Priority', upsertById(state.value, action.payload, 'ID'));
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.Filters) {
                state.value = sortCollection(
                    'Priority',
                    updateCollection({
                        model: state.value,
                        events: action.payload.Filters,
                        itemKey: 'Filter',
                    })
                );
            }
        });
    },
});

export const filtersReducer = { [name]: slice.reducer };
export const filtersThunk = modelThunk.thunk;
export const filtersActions = slice.actions;

export const filterThunk = ({
    filter: oldFilter,
}: {
    filter: Pick<Filter, 'ID'>;
    cache: CacheType;
}): ThunkAction<Promise<void>, MailFiltersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch, getState, extra) => {
        const filter = await getFilter(extra.api, oldFilter.ID);
        dispatch(filtersActions.upsertFilter(filter));
    };
};

export const filtersEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: MailEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, MailFiltersState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.Filters,
            get: (ID) => getFilter(api, ID),
            refetch: () => dispatch(filtersThunk({ cache: CacheType.None })),
            update: (result) => dispatch(filtersActions.eventLoopV6(result)),
        });
    };
};
