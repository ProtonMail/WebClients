import { createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getContactGroup, getFolders, getLabels, getSystemFolders } from '@proton/shared/lib/api/labels';
import updateCollection, { sortCollection } from '@proton/shared/lib/helpers/updateCollection';
import type { Api, Category } from '@proton/shared/lib/interfaces';

const name = 'categories' as const;

const extractLabels = ({ Labels = [] }) => Labels;

const getLabelsModel = async (api: Api) => {
    const [labels = [], folders = [], contactGroups = [], systemFolders = []] = await Promise.all([
        api(getLabels()).then(extractLabels),
        api(getFolders()).then(extractLabels),
        api(getContactGroup()).then(extractLabels),
        api(getSystemFolders()).then(extractLabels),
    ]);
    return sortCollection('Order', [...labels, ...folders, ...contactGroups, ...systemFolders]);
};

export interface CategoriesState {
    [name]: ModelState<Category[]>;
}

type SliceState = CategoriesState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectCategories = (state: CategoriesState) => state[name];

const modelThunk = createAsyncModelThunk<Model, CategoriesState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument }) => {
        return getLabelsModel(extraArgument.api);
    },
    previous: previousSelector(selectCategories),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.Labels) {
                state.value = sortCollection(
                    'Order',
                    updateCollection({
                        model: state.value,
                        events: action.payload.Labels,
                        itemKey: 'Label',
                        // Event updates don't return e.g. ParentID so it's better that the old value gets completely dropped instead of merged
                        merge: (_, b) => b as Category,
                    })
                );
            }
        });
    },
});

export const categoriesReducer = { [name]: slice.reducer };
export const categoriesThunk = modelThunk.thunk;
