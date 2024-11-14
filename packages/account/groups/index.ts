import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { getGroups } from '@proton/shared/lib/api/groups';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { clearBit, setBit } from '@proton/shared/lib/helpers/bitset';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Group, Organization, UserModel } from '@proton/shared/lib/interfaces';

import type { DomainsState } from '../domains';
import { serverEvent } from '../eventLoop';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import { organizationThunk } from '../organization';
import type { OrganizationKeyState } from '../organizationKey';
import { userThunk } from '../user';

const name = 'groups';

export interface GroupsState extends DomainsState, OrganizationKeyState {
    [name]: ModelState<Group[]>;
}

type SliceState = GroupsState[typeof name];
type Model = NonNullable<SliceState['value']>;

const initialState: SliceState = getInitialModelState<Group[]>();

export const selectGroups = (state: GroupsState) => state[name];

const canFetch = (user: UserModel, organization: Organization) => {
    return user.isAdmin && organization?.ID; // just need an org ID to get groups
};

const modelThunk = createAsyncModelThunk<Model, GroupsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        const [user, organization] = await Promise.all([dispatch(userThunk()), dispatch(organizationThunk())]);
        if (!canFetch(user, organization)) {
            return [];
        }
        return extraArgument
            .api(getGroups())
            .then(({ Groups }: { Groups: Group[] }) => Groups)
            .catch(() => []);
    },
    previous: previousSelector(selectGroups),
});

const slice = createSlice({
    name,
    initialState,
    reducers: {
        addGroup: (state, action: PayloadAction<Group>) => {
            if (!state.value) {
                state.value = [];
            }

            // early return if the group already exists
            if (state.value.find((group) => group.ID === action.payload.ID)) {
                return;
            }

            state.value.push(action.payload);
        },
        updateGroup: (state, action: PayloadAction<Group>) => {
            if (!state.value) {
                state.value = [];
            }
            const index = state.value.findIndex((group) => group.ID === action.payload.ID);
            if (index !== -1) {
                state.value[index] = action.payload;
            }
        },
        removeGroup: (state, action: PayloadAction<string>) => {
            if (state.value && action.payload) {
                const updatedGroups = state.value.filter((group) => group.ID !== action.payload);
                state.value = updatedGroups;
            }
        },
        setNoEncryptFlag: (state, action: PayloadAction<{ addressID: string; noEncryptFlag: boolean }>) => {
            const addressID = action.payload.addressID;
            const noEncryptFlag = action.payload.noEncryptFlag;
            if (!state.value) {
                return;
            }

            const index = state.value.findIndex((group) => group.Address.ID === addressID);
            if (index === -1) {
                return;
            }

            const group = state.value[index];

            const groupAddress = group.Address;

            if (!('Keys' in groupAddress)) {
                return;
            }

            const groupAddressKeys = groupAddress.Keys;
            const flags = groupAddressKeys[0].Flags;
            const bit = KEY_FLAG.FLAG_EMAIL_NO_ENCRYPT;

            let newFlags;

            if (noEncryptFlag) {
                newFlags = setBit(flags, bit);
            } else {
                newFlags = clearBit(flags, bit);
            }

            state.value[index] = {
                ...group,
                Address: {
                    ...groupAddress,
                    Keys: [
                        {
                            ...groupAddressKeys[0],
                            Flags: newFlags,
                        },
                    ],
                },
            };
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (!state.value) {
                return;
            }

            if (action.payload.Groups) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.Groups,
                    itemKey: 'Group',
                });
            }
        });
    },
});
export const { addGroup, updateGroup, removeGroup, setNoEncryptFlag } = slice.actions;
export const groupsReducer = { [name]: slice.reducer };
export const groupThunk = modelThunk.thunk;
