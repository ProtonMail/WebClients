import { type PayloadAction, type ThunkAction, type UnknownAction, createSlice } from '@reduxjs/toolkit';

import { type ModelState, getInitialModelState, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { CacheType, createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import type { MailEventV6Response } from '@proton/shared/lib/api/events';
import { queryAllOutgoingForwardings, queryOutgoingForwarding } from '@proton/shared/lib/api/forwardings';
import { updateCollectionAsyncV6 } from '@proton/shared/lib/eventManager/updateCollectionAsyncV6';
import { type UpdateCollectionV6, updateCollectionV6 } from '@proton/shared/lib/eventManager/updateCollectionV6';
import updateCollection from '@proton/shared/lib/helpers/updateCollection';
import type { Api, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';
import { removeById } from '@proton/utils/removeById';
import { upsertById } from '@proton/utils/upsertById';

export interface OutgoingAddressForwardingState {
    outgoingAddressForwarding: ModelState<OutgoingAddressForwarding[]>;
}

const name = 'outgoingAddressForwarding';
type SliceState = OutgoingAddressForwardingState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const getOutgoingAddressForwarding = async (api: Api, id: string) => {
    const { OutgoingAddressForwarding } = await api<{
        OutgoingAddressForwarding: OutgoingAddressForwarding;
    }>(queryOutgoingForwarding(id));

    return OutgoingAddressForwarding;
};

export const selectOutgoingForwarding = (state: OutgoingAddressForwardingState) => state[name];

const modelThunk = createAsyncModelThunk<Model, OutgoingAddressForwardingState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: ({ extraArgument }) => {
        return queryAllOutgoingForwardings(extraArgument.api);
    },
    previous: previousSelector(selectOutgoingForwarding),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        eventLoopV6: (state, action: PayloadAction<UpdateCollectionV6<OutgoingAddressForwarding>>) => {
            if (state.value) {
                state.value = updateCollectionV6(state.value, action.payload);
            }
        },
        upsertForwarding: (state, action: PayloadAction<OutgoingAddressForwarding>) => {
            if (!state.value) {
                return;
            }
            state.value = upsertById(state.value, action.payload, 'ID');
        },
        deleteForwarding: (state, action: PayloadAction<OutgoingAddressForwarding>) => {
            if (!state.value) {
                return;
            }
            state.value = removeById(state.value, action.payload, 'ID');
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.OutgoingAddressForwardings) {
                state.value = updateCollection({
                    model: state.value,
                    events: action.payload.OutgoingAddressForwardings,
                    itemKey: 'OutgoingAddressForwarding',
                });
            }
        });
    },
});

export const outgoingAddressForwardingsReducer = { [name]: slice.reducer };
export const outgoingAddressForwardingsThunk = modelThunk.thunk;
export const outgoingAddressForwardingsActions = slice.actions;

export const outgoingForwardingEventLoopV6Thunk = ({
    event,
    api,
}: {
    event: MailEventV6Response;
    api: Api;
}): ThunkAction<Promise<void>, OutgoingAddressForwardingState, ProtonThunkArguments, UnknownAction> => {
    return async (dispatch) => {
        await updateCollectionAsyncV6({
            events: event.OutgoingForwardings,
            get: (ID) => getOutgoingAddressForwarding(api, ID),
            refetch: () => dispatch(outgoingAddressForwardingsThunk({ cache: CacheType.None })),
            update: (result) => dispatch(outgoingAddressForwardingsActions.eventLoopV6(result)),
        });
    };
};
