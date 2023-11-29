import { createSlice } from '@reduxjs/toolkit';

import { ModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store/interface';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getContactGroup, getFolders, getLabels, getSystemFolders } from '@proton/shared/lib/api/labels';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import { Api, Label } from '@proton/shared/lib/interfaces';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts';

export type Category = Folder | Label | ContactGroup;

const name = 'categories' as const;

const extractLabels = ({ Labels = [] }) => Labels;

const getLabelsModel = async (api: Api) => {
    const [labels = [], folders = [], contactGroups = [], systemFolders = []] = await Promise.all([
        api(getLabels()).then(extractLabels),
        api(getFolders()).then(extractLabels),
        api(getContactGroup()).then(extractLabels),
        api(getSystemFolders()).then(extractLabels),
    ]);
    return [...labels, ...folders, ...contactGroups, ...systemFolders];
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
            if (state.value && action.payload.Labels) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Labels,
                    itemKey: 'Label',
                    // Event updates don't return e.g. ParentID so it's better that the old value gets completely dropped instead of merged
                    merge: (_, b) => b,
                });
            }
        });
    },
});

export const categoriesReducer = { [name]: slice.reducer };
export const categoriesThunk = modelThunk.thunk;
