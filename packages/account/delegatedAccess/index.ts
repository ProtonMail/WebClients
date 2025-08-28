import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { getFetchedAt, getFetchedEphemeral } from '@proton/redux-utilities';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import { removeById } from '@proton/utils/removeById';
import { upsertById } from '@proton/utils/upsertById';

import type { AddressKeysState } from '../addressKeys';
import type { AddressesState } from '../addresses';
import { serverEvent } from '../eventLoop';
import type { InactiveKeysState } from '../inactiveKeys';
import { getInitialModelState } from '../initialModelState';
import type { ModelState } from '../interface';
import type { KtState } from '../kt';
import type { OrganizationKeyState } from '../organizationKey';
import type { UserState } from '../user';
import type { UserKeysState } from '../userKeys';
import type { IncomingDelegatedAccessOutput, OutgoingDelegatedAccessOutput } from './interface';

const name = 'delegatedAccess';

export interface DelegatedAccessState
    extends UserState,
        AddressesState,
        UserKeysState,
        AddressKeysState,
        InactiveKeysState,
        OrganizationKeyState,
        KtState {
    [name]: {
        incomingDelegatedAccess: ModelState<IncomingDelegatedAccessOutput[]> & {
            ephemeral?: { [key: string]: boolean | undefined };
        };
        outgoingDelegatedAccess: ModelState<OutgoingDelegatedAccessOutput[]>;
    };
}

type SliceState = DelegatedAccessState[typeof name];

export const selectIncomingDelegatedAccess = (state: DelegatedAccessState) => state[name].incomingDelegatedAccess;
export const selectOutgoingDelegatedAccess = (state: DelegatedAccessState) => state[name].outgoingDelegatedAccess;

const initialState: SliceState = {
    incomingDelegatedAccess: getInitialModelState<IncomingDelegatedAccessOutput[]>(),
    outgoingDelegatedAccess: getInitialModelState<OutgoingDelegatedAccessOutput[]>(),
};

const sort = <T extends { CreateTime: number }>(list: T[]) => {
    return list.sort((a, b) => a.CreateTime - b.CreateTime);
};

const slice = createSlice({
    name,
    initialState,
    reducers: {
        loadIncomingItem: (state, action: PayloadAction<{ id: string; value: boolean; type: 'access' }>) => {
            if (!state.incomingDelegatedAccess.ephemeral) {
                state.incomingDelegatedAccess.ephemeral = {};
            }
            const id = `${action.payload.id}-${action.payload.type}`;
            if (!action.payload.value) {
                delete state.incomingDelegatedAccess.ephemeral[id];
            } else {
                state.incomingDelegatedAccess.ephemeral[id] = action.payload.value;
            }
        },
        pendingOutgoingList: (state) => {
            state.outgoingDelegatedAccess.error = undefined;
        },
        fulfillOutgoingList: (state, action: PayloadAction<OutgoingDelegatedAccessOutput[]>) => {
            state.outgoingDelegatedAccess.value = sort(action.payload);
            state.outgoingDelegatedAccess.error = undefined;
            state.outgoingDelegatedAccess.meta.fetchedAt = getFetchedAt();
            state.outgoingDelegatedAccess.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejectOutgoingList: (state, action) => {
            state.outgoingDelegatedAccess.error = action.payload;
            state.outgoingDelegatedAccess.meta.fetchedAt = getFetchedAt();
        },
        deleteOutgoingItem: (
            state,
            action: PayloadAction<Pick<OutgoingDelegatedAccessOutput, 'DelegatedAccessID'>>
        ) => {
            if (!state.outgoingDelegatedAccess.value) {
                return;
            }
            state.outgoingDelegatedAccess.value = sort(
                removeById(state.outgoingDelegatedAccess.value, action.payload, 'DelegatedAccessID')
            );
        },
        upsertOutgoingItem: (state, action: PayloadAction<OutgoingDelegatedAccessOutput>) => {
            if (!state.outgoingDelegatedAccess.value) {
                return;
            }
            state.outgoingDelegatedAccess.value = sort(
                upsertById(state.outgoingDelegatedAccess.value, action.payload, 'DelegatedAccessID')
            );
        },

        pendingIncomingList: (state) => {
            state.incomingDelegatedAccess.error = undefined;
        },
        fulfillIncomingList: (state, action: PayloadAction<IncomingDelegatedAccessOutput[]>) => {
            state.incomingDelegatedAccess.value = sort(action.payload);
            state.incomingDelegatedAccess.error = undefined;
            state.incomingDelegatedAccess.meta.fetchedAt = getFetchedAt();
            state.incomingDelegatedAccess.meta.fetchedEphemeral = getFetchedEphemeral();
        },
        rejectIncomingList: (state, action) => {
            state.incomingDelegatedAccess.error = action.payload;
            state.incomingDelegatedAccess.meta.fetchedAt = getFetchedAt();
        },
        upsertIncomingItem: (state, action: PayloadAction<IncomingDelegatedAccessOutput>) => {
            if (!state.incomingDelegatedAccess.value) {
                return;
            }
            state.incomingDelegatedAccess.value = sort(
                upsertById(state.incomingDelegatedAccess.value, action.payload, 'DelegatedAccessID')
            );
        },
        deleteIncomingItem: (
            state,
            action: PayloadAction<Pick<IncomingDelegatedAccessOutput, 'DelegatedAccessID'>>
        ) => {
            if (!state.incomingDelegatedAccess.value) {
                return;
            }
            state.incomingDelegatedAccess.value = sort(
                removeById(state.incomingDelegatedAccess.value, action.payload, 'DelegatedAccessID')
            );
        },
        incomingEventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<IncomingDelegatedAccessOutput>>) => {
            if (state.incomingDelegatedAccess.value) {
                state.incomingDelegatedAccess.value = updateCollectionV6(
                    state.incomingDelegatedAccess.value,
                    action.payload,
                    {
                        idKey: 'DelegatedAccessID',
                    }
                );
            }
        },
        outgoingEventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<OutgoingDelegatedAccessOutput>>) => {
            if (state.outgoingDelegatedAccess.value) {
                state.outgoingDelegatedAccess.value = updateCollectionV6(
                    state.outgoingDelegatedAccess.value,
                    action.payload,
                    {
                        idKey: 'DelegatedAccessID',
                    }
                );
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(serverEvent, (state, action) => {
            if (state.incomingDelegatedAccess.value && action.payload.IncomingDelegatedAccess) {
                state.incomingDelegatedAccess.value = updateCollection({
                    model: state.incomingDelegatedAccess.value,
                    events: action.payload.IncomingDelegatedAccess,
                    itemKey: 'DelegatedAccess',
                    idKey: 'DelegatedAccessID',
                });
                state.incomingDelegatedAccess.error = undefined;
            }
            if (state.outgoingDelegatedAccess.value && action.payload.OutgoingDelegatedAccess) {
                state.outgoingDelegatedAccess.value = updateCollection({
                    model: state.outgoingDelegatedAccess.value,
                    events: action.payload.OutgoingDelegatedAccess,
                    itemKey: 'DelegatedAccess',
                    idKey: 'DelegatedAccessID',
                });
                state.outgoingDelegatedAccess.error = undefined;
            }
        });
    },
});

export const delegatedAccessReducer = { [name]: slice.reducer };
export const delegatedAccessActions = slice.actions;
