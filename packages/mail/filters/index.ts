import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { Filter } from '@proton/components/containers/filters/interfaces';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { queryFilters } from '@proton/shared/lib/api/filters';
import updateCollection, { sortCollection } from '@proton/shared/lib/helpers/updateCollection';

const name = 'filters' as const;

interface State {
    [name]: ModelState<Filter[]>;
}

type SliceState = State[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectFilters = (state: State) => state.filters;

const modelThunk = createAsyncModelThunk<Model, State, ProtonThunkArguments>(`${name}/fetch`, {
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
    reducers: {},
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
