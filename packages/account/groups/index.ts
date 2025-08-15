import type { PayloadAction, ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { CoreEventV6Response } from '@proton/shared/lib/api/events';
import { getGroup, getGroups } from '@proton/shared/lib/api/groups';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import { clearBit, setBit } from '@proton/shared/lib/helpers/bitset';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Api, Group, Organization, UserModel } from '@proton/shared/lib/interfaces';

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

export const fetchGroup = async (groupID: string, api: Api) => {
    const { Group } = await api<{ Group: Group }>(getGroup(groupID));
    return Group;
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
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<Group>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
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
                state.value = state.value.filter((group) => group.ID !== action.payload);
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
export const groupsActions = slice.actions;
export const groupThunk = modelThunk.thunk;

export const groupsEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: CoreEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, GroupsState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.Groups,
            get: (ID) => fetchGroup(ID, api),
            refetch: () => dispatch(groupThunk({ cache: CacheType.None })),
            update: (result) => dispatch(groupsActions.eventLoopV6(result)),
        });
    };
};
